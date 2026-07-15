import { is } from "zod/v4/locales";
import TaskModel from "../../models/task.model.js";
import TeamModel from "../../models/team.model.js";
import UserModel from "../../models/user.model.js";

const allowedTransitions = {
  todo: ["in_progress"],
  in_progress: ["review", "todo"],
  review: ["done", "in_progress"],
  done: [],
};
const removeTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};
const canChangeStatus = (currentStatus, newStatus) => {
  return allowedTransitions[currentStatus]?.includes(newStatus);
};
export const Create_Task = async (req, res, next) => {
  try {
    const { title, description, dueDate, team, assignedTo = [] } = req.body;

    const userId = req.user._id;
    const exist_team = await TeamModel.findById(team);

    if (!exist_team) {
      return res.status(404).json({ message: "team not found" });
    }

    const isMember = await exist_team.members.find(
      (m) => m.user.toString() === userId.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "you are not a member of this team" });
    }
    console.log(isMember);

    if (is_Member.role !== "admin") {
      return res
        .status(403)
        .json({ message: "you are not an admin of this team" });
    }

    const new_task = await TaskModel.create({
      title,
      description,
      dueDate,
      team,
      assignedTo,
      createdBy: userId,
    });

    return res.status(201).json({ message: "Task created successfully" });
  } catch (error) {
    return next(error);
  }
};

export const Get_TaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.findById(id)
      .populate("team", "name")
      .populate("createdBy", "name email image")
      .populate("assignedTo", "name email image")
      .populate("comments.user", "name email image");
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    return res.status(200).json({ message: "task fetched", task });
  } catch (error) {
    return next(error);
  }
};

export const Get_Task = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const tasks = await TaskModel.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    })
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    return res.status(200).json({
      message: "tasks fetched",
      tasks,
    });
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

    const isAllowed =
      task.createdBy.toString() === userId.toString() ||
      task.assignedTo.includes(userId);

    if (!isAllowed) {
      return res.status(403).json({
        message: "not allowed to update this task",
      });
    }
    const isAdmin = await UserModel.findById(userId);
    if (isAdmin.role !== "admin") {
      return res.status(403).json({
        message: "not allowed to update this task",
      });
    }
    const { title, description, dueDate, team, assignedTo = [] } = req.body;
    task.title = title;
    task.description = description;
    task.dueDate = dueDate;
    task.team = team;
    task.assignedTo = assignedTo;
    await task.save();
    return res.status(200).json({ message: "task updated", task });
  } catch (error) {
    return next(error);
  }
};

export const update_TaskStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const task = await TaskModel.findById(id).populate("team");

    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }

    const team = await TeamModel.findById(task.team);

    const member = team.members.find(
      (m) => m.user.toString() === userId.toString(),
    );

    if (!member) {
      return res.status(403).json({ message: "not a team member" });
    }

    const isAssigned = task.assignedTo.some(
      (u) => u.toString() === userId.toString(),
    );

    const isAdmin = member.role === "admin";

  
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        message: "not allowed",
      });
    }


    const isValidTransition = canChangeStatus(task.status, status);

    if (!isValidTransition) {
      return res.status(400).json({
        message: `invalid status transition from ${task.status} to ${status}`,
      });
    }

    task.status = status;
    await task.save();

    return res.status(200).json({
      message: "status updated",
      task,
    });
  } catch (error) {
    return next(error);
  }
};

export const delete_Task = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.find({ _id: id });
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "you are not the creator of this task" });
    }

    await TaskModel.findByIdAndDelete(id);

    return res.status(200).json({ message: "task deleted" });
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

    const newComment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    task.comments.push(newComment);

    await task.save();

    return res.status(201).json({
      message: "comment added",
      comments: task.comments,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateComment = async (req, res, next) => {
  const { id, commentId } = req.params;
  const { text } = req.body;

  const existingTask = await taskModel.findById(id);
  if (!existingTask) {
    return res.status(404).json({ message: "task not found" });
  }

  const commentIndex = existingTask.comments.findIndex(
    (comment) => comment._id.toString() === commentId,
  );

  if (commentIndex === -1) {
    return res.status(404).json({ message: "comment not found" });
  } else {
    existingTask.comments[commentIndex].text = text;
  } 

  await existingTask.save();
  return res
    .status(200)
    .json({ message: "comment updated", comment: existingTask.comments });
};
 

export const deleteComment = async (req, res, next) => {
  const { id } = req.params;

  const existingTask = await taskModel.findById(id);
  if (!existingTask) {
    return res.status(404).json({ message: "task not found" });
  }

  existingTask.comments.splice(commentIndex, 1);
  await existingTask.save();
  return res.status(200).json({ message: "comment deleted" });
};

export const uploadTaskAttachments = async (req, res, next) => {
  const uploadedImages = [];

  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const task = await TaskModel.findById(id);

    if (!task) {
      req.files.forEach((file) => {
        removeTempFile(file.path);
      });

      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (task.createdBy.toString() !== userId.toString()) {
      req.files.forEach((file) => {
        removeTempFile(file.path);
      });

      return res.status(403).json({
        message: "You are not allowed to upload attachments to this task",
      });
    }

    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `task-management/tasks/${id}`,
          resource_type: "image",
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

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,

      {
        $push: {
          attachments: {
            $each: uploadedImages,
          },
        },
      },

      {
        new: true,
      },
    );

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

    next(error);
  }
};

export const changeTaskimage = async (req, res, next) => {
  const { id } = req.params;
  const task = await TaskModel.findById(id);
  if (!task) {
    removeTempFile(req.file?.path);
    return res.status(404).json({ message: "task not found" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "file not found" });
  }

  if (task.attachments && task.attachments.public_id) {
    await cloudinary.uploader.destroy(task.attachment.public_id);
  }
  const image = await cloudinary.uploader.upload(req.file.path, {
    folder: `task-management/users/${id}`,
  });
  removeTempFile(req.file.path);

  await TaskModel.updateOne(
    {
      _id: id,
    },

    {
      $push: {
        attachments: {
          secure_url: image.secure_url,
          public_id: image.public_id,
          uploadedBy: userId,
        },
      },
    },
  );

  return res.status(201).json({
    message: "attachment uploaded successfully",
    attachment: {
      secure_url: image.secure_url,
      public_id: image.public_id,
    },
  });
};

export const getTaskAttachments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    const attachments = task.attachments;
    return res
      .status(200)
      .json({ message: "task attachments fetched", attachments });
  } catch (error) {
    return next(error);
  }
};
export const deleteTaskAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { public_id } = req.body;
    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "task not found" });
    }
    const attachment = task.attachments.find(
      (attachment) => attachment.public_id === public_id,
    );
    if (!attachment) {
      return res.status(404).json({ message: "attachment not found" });
    }
    await cloudinary.uploader.destroy(public_id);
    task.attachments = task.attachments.filter(
      (attachment) => attachment.public_id !== public_id,
    );
    await task.save();
    return res.status(200).json({ message: "attachment deleted" });
  } catch (error) {
    return next(error);
  }
};
