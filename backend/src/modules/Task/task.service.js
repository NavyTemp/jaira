import fs from "fs";

import TaskModel from "../../models/task.model.js";
import TeamModel from "../../models/team.model.js";
import cloudinary from "../../service/cloudinary.js";
import { createActivity } from "../../service/activity.js";
import { createNotifications } from "../notification/notification.service.js";
import {
  createTaskChat,
  addParticipant,
  deleteChatCascade,
} from "../chat/chat.service.js";
import { emitToUser, emitToChat } from "../../sockets/socket.js";

const allowedTransitions = {
  todo: ["in_progress"],
  in_progress: ["review", "todo"],
  review: ["done", "in_progress"],
  done: [],
};

const canChangeStatus = (currentStatus, newStatus) =>
  currentStatus === newStatus ||
  allowedTransitions[currentStatus]?.includes(newStatus);

const removeTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

/** "owner" | "admin" | "member" | null for the given user in a team doc. */
const getTeamRole = (team, userId) => {
  if (!team) return null;
  if (team.ownerId?.toString() === userId.toString()) return "owner";
  const member = team.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member ? member.role : null;
};

const uniqueIds = (ids = []) => [
  ...new Set(ids.filter(Boolean).map((id) => id.toString())),
];

const canAccessTask = (task, teamDoc, userId) => {
  const isCreator = task.createdBy.toString() === userId.toString();
  const isAssignee = task.assignedTo.some(
    (u) => u.toString() === userId.toString(),
  );
  const isTeamMember = getTeamRole(teamDoc, userId) !== null;
  return isCreator || isAssignee || isTeamMember;
};

/** Push a live task change to everyone who cares (creator, assignees, chat). */
const emitTaskUpdate = (task, event = "task:updated") => {
  const payload = { taskId: task._id.toString(), task };
  const recipients = [task.createdBy, ...(task.assignedTo || [])];
  recipients.forEach((r) => emitToUser(r, event, payload));
  if (task.chat) emitToChat(task.chat, event, payload);
};

// ─── CRUD ────────────────────────────────────────────────

export const Create_Task = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      tags,
      team,
      assignedTo = [],
    } = req.body;

    const userId = req.user._id;
    let teamDoc = null;

    if (team) {
      teamDoc = await TeamModel.findById(team);
      if (!teamDoc) {
        return res.status(404).json({ message: "team not found" });
      }
      if (!getTeamRole(teamDoc, userId)) {
        return res
          .status(403)
          .json({ message: "you are not a member of this team" });
      }
    }

    const task = await TaskModel.create({
      title,
      description,
      dueDate,
      priority,
      tags,
      team: team || undefined,
      assignedTo,
      createdBy: userId,
    });

    // A team task gets its own chat + is linked back to the team.
    if (teamDoc) {
      const chat = await createTaskChat(task._id, teamDoc._id, [
        userId,
        ...assignedTo,
      ]);
      task.chat = chat._id;
      await task.save();

      await TeamModel.findByIdAndUpdate(teamDoc._id, {
        $addToSet: { tasksId: task._id },
      });
    }

    await createActivity({
      team: teamDoc?._id,
      task: task._id,
      user: userId,
      action: "task_created",
      metadata: { title: task.title },
    });

    await createNotifications(assignedTo, {
      message: `You were assigned to task "${task.title}"`,
      type: "task",
      relatedId: task._id,
      exclude: userId,
    });

    const populated = await task.populate([
      { path: "team", select: "name" },
      { path: "assignedTo", select: "name email image" },
      { path: "createdBy", select: "name email image" },
    ]);

    return res
      .status(201)
      .json({ message: "Task created successfully", task: populated });
  } catch (error) {
    return next(error);
  }
};

export const Get_Task = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, priority, team, assignedTo, dueBefore, dueAfter } =
      req.query;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const filter = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (team) filter.team = team;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }

    const [tasks, total] = await Promise.all([
      TaskModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("team", "name")
        .populate("createdBy", "name email image")
        .populate("assignedTo", "name email image"),
      TaskModel.countDocuments(filter),
    ]);

    return res
      .status(200)
      .json({ message: "tasks fetched", tasks, page, limit, total });
  } catch (error) {
    return next(error);
  }
};

export const Get_TaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await TaskModel.findById(id)
      .populate("team", "name members ownerId")
      .populate("createdBy", "name email image")
      .populate("assignedTo", "name email image")
      .populate("comments.user", "name email image");

    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const isCreator = task.createdBy?._id?.toString() === userId.toString();
    const isAssignee = task.assignedTo?.some(
      (u) => u._id.toString() === userId.toString(),
    );
    const isTeamMember = task.team
      ? getTeamRole(task.team, userId) !== null
      : false;

    if (!isCreator && !isAssignee && !isTeamMember) {
      return res
        .status(403)
        .json({ message: "you are not allowed to view this task" });
    }

    return res.status(200).json({ message: "task fetched", task });
  } catch (error) {
    return next(error);
  }
};

export const update_Task = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    const role = getTeamRole(teamDoc, userId);
    const isCreator = task.createdBy.toString() === userId.toString();
    if (!isCreator && role !== "owner" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "not allowed to update this task" });
    }

    const { title, description, dueDate, priority, tags } = req.body;

    const oldData = {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      tags: task.tags,
    };

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "task_updated",
      metadata: {
        oldData,
        newData: { title, description, dueDate, priority, tags },
      },
    });

    emitTaskUpdate(task);

    return res.status(200).json({ message: "task updated", task });
  } catch (error) {
    return next(error);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { assignedTo = [] } = req.body;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    const role = getTeamRole(teamDoc, userId);
    const isCreator = task.createdBy.toString() === userId.toString();
    if (!isCreator && role !== "owner" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "not allowed to assign this task" });
    }

    const previous = uniqueIds(task.assignedTo);
    task.assignedTo = assignedTo;
    await task.save();

    const added = uniqueIds(assignedTo).filter((x) => !previous.includes(x));
    if (task.chat) {
      await Promise.all(added.map((uid) => addParticipant(task.chat, uid)));
    }

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "user_assigned",
      metadata: { assignedTo },
    });

    await createNotifications(added, {
      message: `You were assigned to task "${task.title}"`,
      type: "task",
      relatedId: task._id,
      exclude: userId,
    });

    emitTaskUpdate(task);

    return res.status(200).json({ message: "task assignment updated", task });
  } catch (error) {
    return next(error);
  }
};

export const update_TaskStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const oldStatus = task.status;

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    const role = getTeamRole(teamDoc, userId);
    const isCreator = task.createdBy.toString() === userId.toString();
    const isAssigned = task.assignedTo.some(
      (u) => u.toString() === userId.toString(),
    );

    if (!isAssigned && !isCreator && role !== "owner" && role !== "admin") {
      return res.status(403).json({ message: "not allowed" });
    }

    if (!canChangeStatus(oldStatus, status)) {
      return res.status(400).json({
        message: `invalid status transition from ${oldStatus} to ${status}`,
      });
    }

    task.status = status;
    await task.save();

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "status_changed",
      metadata: { oldStatus, newStatus: status },
    });

    await createNotifications([task.createdBy, ...task.assignedTo], {
      message: `Task "${task.title}" moved to ${status}`,
      type: "task",
      relatedId: task._id,
      exclude: userId,
    });

    emitTaskUpdate(task);

    return res.status(200).json({ message: "status updated", task });
  } catch (error) {
    return next(error);
  }
};

export const delete_Task = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    const role = getTeamRole(teamDoc, userId);
    const isCreator = task.createdBy.toString() === userId.toString();
    if (!isCreator && role !== "owner" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "you are not allowed to delete this task" });
    }

    if (task.team) {
      await TeamModel.findByIdAndUpdate(task.team, {
        $pull: { tasksId: task._id },
      });
    }
    if (task.chat) {
      await deleteChatCascade(task.chat);
    }

    await TaskModel.findByIdAndDelete(id);

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "task_deleted",
      metadata: { title: task.title },
    });

    emitTaskUpdate(task, "task:deleted");

    return res.status(200).json({ message: "task deleted" });
  } catch (error) {
    return next(error);
  }
};

// ─── COMMENTS (embedded) ─────────────────────────────────

export const listComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.findById(id).populate(
      "comments.user",
      "name email image",
    );
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    return res
      .status(200)
      .json({ message: "comments fetched", comments: task.comments });
  } catch (error) {
    return next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    if (!canAccessTask(task, teamDoc, userId)) {
      return res
        .status(403)
        .json({ message: "not allowed to comment on this task" });
    }

    task.comments.push({ user: userId, text, createdAt: new Date() });
    await task.save();

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "comment_added",
      metadata: { comment: text },
    });

    await createNotifications([task.createdBy, ...task.assignedTo], {
      message: `New comment on task "${task.title}"`,
      type: "task",
      relatedId: task._id,
      exclude: userId,
    });

    const populated = await task.populate("comments.user", "name email image");

    return res
      .status(201)
      .json({ message: "comment added", comments: populated.comments });
  } catch (error) {
    return next(error);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "only the author can edit this comment" });
    }

    comment.text = text;
    await task.save();

    return res.status(200).json({ message: "comment updated", comment });
  } catch (error) {
    return next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    const role = getTeamRole(teamDoc, userId);
    const isAuthor = comment.user.toString() === userId.toString();
    if (!isAuthor && role !== "owner" && role !== "admin") {
      return res
        .status(403)
        .json({ message: "not allowed to delete this comment" });
    }

    comment.deleteOne();
    await task.save();

    await createActivity({
      team: task.team,
      task: task._id,
      user: userId,
      action: "comment_deleted",
      metadata: { commentId },
    });

    return res.status(200).json({ message: "comment deleted" });
  } catch (error) {
    return next(error);
  }
};

// ─── ATTACHMENTS ─────────────────────────────────────────

export const uploadTaskAttachments = async (req, res, next) => {
  const uploadedImages = [];
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const task = await TaskModel.findById(id);
    if (!task) {
      req.files.forEach((file) => removeTempFile(file.path));
      return res.status(404).json({ message: "Task not found" });
    }

    const teamDoc = task.team ? await TeamModel.findById(task.team) : null;
    if (!canAccessTask(task, teamDoc, userId)) {
      req.files.forEach((file) => removeTempFile(file.path));
      return res
        .status(403)
        .json({ message: "not allowed to upload attachments to this task" });
    }

    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `task-management/tasks/${id}`,
          resource_type: "auto",
        });
        uploadedImages.push({
          secure_url: result.secure_url,
          public_id: result.public_id,
          uploadedBy: userId,
        });
      } finally {
        removeTempFile(file.path);
      }
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      { $push: { attachments: { $each: uploadedImages } } },
      { new: true },
    );

    await createActivity({
      team: task.team,
      task: id,
      user: userId,
      action: "attachment_uploaded",
      metadata: { files: uploadedImages.map((f) => f.public_id) },
    });

    return res.status(201).json({
      message: "Task attachments uploaded successfully",
      task: updatedTask,
    });
  } catch (error) {
    if (uploadedImages.length) {
      await Promise.all(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.public_id),
        ),
      );
    }
    return next(error);
  }
};

export const getTaskAttachments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    return res.status(200).json({
      message: "task attachments fetched",
      attachments: task.attachments,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { public_id } = req.body;

    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const attachment = task.attachments.find((a) => a.public_id === public_id);
    if (!attachment) {
      return res.status(404).json({ message: "attachment not found" });
    }

    await cloudinary.uploader.destroy(public_id);
    task.attachments = task.attachments.filter(
      (a) => a.public_id !== public_id,
    );
    await task.save();

    await createActivity({
      team: task.team,
      task: id,
      user: userId,
      action: "attachment_deleted",
      metadata: { file: public_id },
    });

    return res.status(200).json({ message: "attachment deleted" });
  } catch (error) {
    return next(error);
  }
};
