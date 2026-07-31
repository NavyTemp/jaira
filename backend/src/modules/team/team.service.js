import fs from "fs";
import TeamModel from "../../models/team.model.js";
import UserModel from "../../models/user.model.js";
import TaskModel from "../../models/task.model.js";
import cloudinary from "../../service/cloudinary.js";
import { createActivity } from "../../service/activity.js";
import { createNotifications } from "../notification/notification.service.js";
import {
  createTeamChat,
  addParticipant,
  removeParticipant,
  deleteChatCascade,
} from "../chat/chat.service.js";

const removeTempFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
};

const isOwner = (team, userId) =>
  team.ownerId.toString() === userId.toString();

const isOwnerOrAdmin = (team, userId) => {
  if (isOwner(team, userId)) return true;
  const member = team.members.find(
    (m) => m.user.toString() === userId.toString(),
  );
  return member?.role === "admin";
};

// ─── CRUD ────────────────────────────────────────────────

export const createTeam = async (req, res, next) => {
  try {
    const { name, description, membersId = [] } = req.body;
    const ownerId = req.user._id;

    // Only keep real, non-deleted users; the owner is added separately as admin.
    const requested = [
      ...new Set(membersId.map((id) => id.toString())),
    ].filter((id) => id !== ownerId.toString());

    const validUsers = await UserModel.find({
      _id: { $in: requested },
      isDeleted: false,
    }).select("_id");

    const members = validUsers.map((u) => ({ user: u._id, role: "member" }));
    members.push({ user: ownerId, role: "admin" });

    const team = await TeamModel.create({
      name,
      description,
      ownerId,
      members,
    });

    // Every team gets a group chat; participants = all members.
    const memberUserIds = members.map((m) => m.user);
    const chat = await createTeamChat(team._id, memberUserIds);
    team.chat = chat._id;
    await team.save();

    await UserModel.updateMany(
      { _id: { $in: memberUserIds } },
      { $addToSet: { teams: team._id } },
    );

    await createActivity({
      team: team._id,
      user: ownerId,
      action: "team_created",
      metadata: { name: team.name },
    });

    await createNotifications(validUsers.map((u) => u._id), {
      message: `You were added to team "${team.name}"`,
      type: "team",
      relatedId: team._id,
      exclude: ownerId,
    });

    const populated = await team.populate([
      { path: "ownerId", select: "name email image" },
      { path: "members.user", select: "name email image" },
    ]);

    return res
      .status(201)
      .json({ message: "Team created successfully", team: populated });
  } catch (error) {
    return next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const teams = await TeamModel.find({ "members.user": userId })
      .sort({ updatedAt: -1 })
      .populate("ownerId", "name email image")
      .populate("members.user", "name email image");

    return res.status(200).json({ message: "teams fetched", teams });
  } catch (error) {
    return next(error);
  }
};

export const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id)
      .populate("ownerId", "name email image")
      .populate("members.user", "name email image")
      .populate("tasksId");

    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    const isMember = team.members.some(
      (m) => m.user?._id?.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "you are not a member of this team" });
    }

    return res.status(200).json({ message: "team fetched", team });
  } catch (error) {
    return next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwnerOrAdmin(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner or admin can update the team" });
    }

    const { name, description } = req.body;
    if (name !== undefined) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "team_updated",
      metadata: { name: team.name },
    });

    return res.status(200).json({ message: "team updated", team });
  } catch (error) {
    return next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwner(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner can delete the team" });
    }

    if (team.image && team.image.public_id) {
      await cloudinary.uploader.destroy(team.image.public_id);
    }

    // Cascade: task chats -> tasks -> team chat -> user membership.
    const tasks = await TaskModel.find({ team: team._id }).select("chat");
    await Promise.all(tasks.map((t) => deleteChatCascade(t.chat)));
    await TaskModel.deleteMany({ team: team._id });
    await deleteChatCascade(team.chat);

    const memberUserIds = team.members.map((m) => m.user);
    await UserModel.updateMany(
      { _id: { $in: memberUserIds } },
      { $pull: { teams: team._id } },
    );

    await TeamModel.findByIdAndDelete(id);

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "team_deleted",
      metadata: { name: team.name },
    });

    return res.status(200).json({ message: "team deleted" });
  } catch (error) {
    return next(error);
  }
};

// ─── MEMBERS ─────────────────────────────────────────────

export const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role = "member" } = req.body;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwnerOrAdmin(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner or admin can add members" });
    }

    const alreadyMember = team.members.some(
      (m) => m.user.toString() === userId,
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "user is already a member" });
    }

    const userExists = await UserModel.findById(userId);
    if (!userExists || userExists.isDeleted) {
      return res.status(404).json({ message: "user not found" });
    }

    team.members.push({ user: userId, role });
    await team.save();

    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { teams: team._id },
    });
    await addParticipant(team.chat, userId);

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "member_added",
      metadata: { addedUser: userId, role },
    });

    await createNotifications([userId], {
      message: `You were added to team "${team.name}"`,
      type: "team",
      relatedId: team._id,
      exclude: req.user._id,
    });

    return res.status(200).json({ message: "member added", team });
  } catch (error) {
    return next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwnerOrAdmin(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner or admin can remove members" });
    }

    if (team.ownerId.toString() === userId) {
      return res.status(400).json({ message: "cannot remove the team owner" });
    }

    const memberIndex = team.members.findIndex(
      (m) => m.user.toString() === userId,
    );
    if (memberIndex === -1) {
      return res
        .status(404)
        .json({ message: "user is not a member of this team" });
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { teams: team._id },
    });
    await removeParticipant(team.chat, userId);

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "member_removed",
      metadata: { removedUser: userId },
    });

    return res.status(200).json({ message: "member removed", team });
  } catch (error) {
    return next(error);
  }
};

export const changeMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwner(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner can change member roles" });
    }

    if (team.ownerId.toString() === userId) {
      return res.status(400).json({ message: "cannot change the owner's role" });
    }

    const member = team.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res
        .status(404)
        .json({ message: "user is not a member of this team" });
    }

    member.role = role;
    await team.save();

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "role_changed",
      metadata: { targetUser: userId, role },
    });

    return res.status(200).json({ message: "member role updated", team });
  } catch (error) {
    return next(error);
  }
};

export const leaveTeam = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    const isMember = team.members.some(
      (m) => m.user.toString() === userId.toString(),
    );
    if (!isMember) {
      return res.status(403).json({ message: "you are not a member" });
    }

    if (isOwner(team, userId)) {
      return res.status(400).json({
        message: "owner cannot leave the team; transfer ownership or delete it",
      });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== userId.toString(),
    );
    await team.save();

    await UserModel.findByIdAndUpdate(userId, { $pull: { teams: team._id } });
    await removeParticipant(team.chat, userId);

    await createActivity({
      team: team._id,
      user: userId,
      action: "leave",
      metadata: { teamName: team.name },
    });

    return res.status(200).json({ message: "left team successfully", team });
  } catch (error) {
    return next(error);
  }
};

export const transferOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }

    if (!isOwner(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner can transfer ownership" });
    }

    const member = team.members.find((m) => m.user.toString() === userId);
    if (!member) {
      return res
        .status(400)
        .json({ message: "target user is not a member of this team" });
    }

    const previousOwnerId = team.ownerId.toString();
    const oldOwnerEntry = team.members.find(
      (m) => m.user.toString() === previousOwnerId,
    );
    if (oldOwnerEntry) oldOwnerEntry.role = "admin";
    member.role = "admin";
    team.ownerId = userId;

    await team.save();

    await createActivity({
      team: team._id,
      user: req.user._id,
      action: "ownership_transferred",
      metadata: { oldOwner: previousOwnerId, newOwner: userId },
    });

    await createNotifications([userId], {
      message: `You are now the owner of team "${team.name}"`,
      type: "team",
      relatedId: team._id,
      exclude: req.user._id,
    });

    return res.status(200).json({ message: "ownership transferred", team });
  } catch (error) {
    return next(error);
  }
};

// ─── IMAGE ───────────────────────────────────────────────

export const uploadTeamImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      removeTempFile(req.file?.path);
      return res.status(404).json({ message: "team not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    if (!isOwnerOrAdmin(team, req.user._id)) {
      removeTempFile(req.file.path);
      return res
        .status(403)
        .json({ message: "only team owner or admin can set the image" });
    }
    if (team.image && team.image.public_id) {
      removeTempFile(req.file.path);
      return res
        .status(400)
        .json({ message: "image already exists, use PUT to change it" });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `task-management/teams/${id}`,
    });
    removeTempFile(req.file.path);

    team.image = {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
    await team.save();

    return res.status(200).json({ message: "team image uploaded", team });
  } catch (error) {
    removeTempFile(req.file?.path);
    return next(error);
  }
};

export const changeTeamImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      removeTempFile(req.file?.path);
      return res.status(404).json({ message: "team not found" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file not found" });
    }
    if (!isOwnerOrAdmin(team, req.user._id)) {
      removeTempFile(req.file.path);
      return res
        .status(403)
        .json({ message: "only team owner or admin can change the image" });
    }
    if (team.image && team.image.public_id) {
      await cloudinary.uploader.destroy(team.image.public_id);
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `task-management/teams/${id}`,
    });
    removeTempFile(req.file.path);

    team.image = {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
    await team.save();
    return res.status(200).json({ message: "team image updated", team });
  } catch (error) {
    removeTempFile(req.file?.path);
    return next(error);
  }
};

export const deleteTeamImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }
    if (!isOwnerOrAdmin(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "only team owner or admin can delete the image" });
    }
    if (!team.image || !team.image.public_id) {
      return res.status(400).json({ message: "team image not found" });
    }
    await cloudinary.uploader.destroy(team.image.public_id);
    team.image = undefined;
    await team.save();
    return res.status(200).json({ message: "team image deleted" });
  } catch (error) {
    return next(error);
  }
};

export const getTeamImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const team = await TeamModel.findById(id);
    if (!team) {
      return res.status(404).json({ message: "team not found" });
    }
    if (!team.image || !team.image.public_id) {
      return res.status(400).json({ message: "team image not found" });
    }
    return res
      .status(200)
      .json({ message: "team image fetched", image: team.image.secure_url });
  } catch (error) {
    return next(error);
  }
};
