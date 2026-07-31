import ChatModel from "../../models/chat.model.js";
import MessageModel from "../../models/message.model.js";
import UserModel from "../../models/user.model.js";
import { AppError } from "../../utlis/appError.js";
import { emitToChat, emitToUser } from "../../sockets/socket.js";

const isParticipant = (chat, userId) =>
  chat.participants.some((p) => p.toString() === userId.toString());

const ensureParticipant = (chat, userId) => {
  if (!isParticipant(chat, userId)) {
    throw new AppError("you are not a participant of this chat", 403);
  }
};

// ─── Internal helpers used by team / task modules ────────

export const createTeamChat = async (teamId, participantIds = []) => {
  return ChatModel.create({
    type: "team",
    team: teamId,
    participants: [...new Set(participantIds.map((id) => id.toString()))],
  });
};

export const createTaskChat = async (taskId, teamId, participantIds = []) => {
  return ChatModel.create({
    type: "task",
    task: taskId,
    team: teamId,
    participants: [...new Set(participantIds.map((id) => id.toString()))],
  });
};

export const addParticipant = async (chatId, userId) => {
  if (!chatId) return;
  await ChatModel.findByIdAndUpdate(chatId, {
    $addToSet: { participants: userId },
  });
};

export const removeParticipant = async (chatId, userId) => {
  if (!chatId) return;
  await ChatModel.findByIdAndUpdate(chatId, {
    $pull: { participants: userId },
  });
};

export const deleteChatCascade = async (chatId) => {
  if (!chatId) return;
  await MessageModel.deleteMany({ chat: chatId });
  await ChatModel.findByIdAndDelete(chatId);
};

// ─── Core message logic (shared by REST + Socket.IO) ─────

export const createMessage = async ({
  chatId,
  senderId,
  text,
  attachments = [],
}) => {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed && attachments.length === 0) {
    throw new AppError("message must have text or attachments", 400);
  }

  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new AppError("chat not found", 404);
  ensureParticipant(chat, senderId);

  const message = await MessageModel.create({
    chat: chatId,
    sender: senderId,
    text: trimmed,
    attachments,
    seenBy: [senderId],
  });

  chat.lastMessage = message._id;
  await chat.save();

  const populated = await message.populate("sender", "name email image");

  // Everyone currently viewing the chat gets the message instantly…
  emitToChat(chatId, "message:new", populated);

  // …and every participant gets a lightweight ping on their personal room so
  // the chat list can bump/order even when the chat isn't open.
  chat.participants.forEach((p) => {
    if (p.toString() !== senderId.toString()) {
      emitToUser(p, "chat:message", { chatId: chatId.toString(), message: populated });
    }
  });

  return populated;
};

export const markMessageSeen = async ({ chatId, messageId, userId }) => {
  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new AppError("chat not found", 404);
  ensureParticipant(chat, userId);

  const message = await MessageModel.findOneAndUpdate(
    { _id: messageId, chat: chatId },
    { $addToSet: { seenBy: userId } },
    { new: true },
  );
  if (!message) throw new AppError("message not found", 404);

  emitToChat(chatId, "message:seen", {
    chatId: chatId.toString(),
    messageId: message._id.toString(),
    userId: userId.toString(),
  });

  return message;
};

// ─── REST handlers ───────────────────────────────────────

export const listMyChats = async (req, res, next) => {
  try {
    const chats = await ChatModel.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate("participants", "name email image")
      .populate("team", "name image")
      .populate("task", "title")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name" },
      });

    return res.status(200).json({ message: "chats fetched", chats });
  } catch (error) {
    return next(error);
  }
};

export const getOrCreateDirectChat = async (req, res, next) => {
  try {
    const me = req.user._id;
    const { userId } = req.body;

    if (userId === me.toString()) {
      return res
        .status(400)
        .json({ message: "cannot start a direct chat with yourself" });
    }

    const other = await UserModel.findById(userId);
    if (!other || other.isDeleted) {
      return res.status(404).json({ message: "user not found" });
    }

    let chat = await ChatModel.findOne({
      type: "direct",
      participants: { $all: [me, userId], $size: 2 },
    }).populate("participants", "name email image");

    if (!chat) {
      chat = await ChatModel.create({
        type: "direct",
        participants: [me, userId],
      });
      chat = await chat.populate("participants", "name email image");
    }

    return res.status(200).json({ message: "direct chat ready", chat });
  } catch (error) {
    return next(error);
  }
};

export const getChatById = async (req, res, next) => {
  try {
    const chat = await ChatModel.findById(req.params.id)
      .populate("participants", "name email image")
      .populate("team", "name image")
      .populate("task", "title");

    if (!chat) return res.status(404).json({ message: "chat not found" });
    ensureParticipant(chat, req.user._id);

    return res.status(200).json({ message: "chat fetched", chat });
  } catch (error) {
    return next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const before = req.query.before;

    const chat = await ChatModel.findById(id).select("participants");
    if (!chat) return res.status(404).json({ message: "chat not found" });
    ensureParticipant(chat, req.user._id);

    const filter = { chat: id };
    if (before) filter._id = { $lt: before };

    const messages = await MessageModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .populate("sender", "name email image");

    // return in chronological order for easy rendering
    messages.reverse();

    return res.status(200).json({
      message: "messages fetched",
      messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    return next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const message = await createMessage({
      chatId: req.params.id,
      senderId: req.user._id,
      text: req.body.text,
      attachments: req.body.attachments,
    });
    return res.status(201).json({ message: "message sent", data: message });
  } catch (error) {
    return next(error);
  }
};

export const seenMessage = async (req, res, next) => {
  try {
    const message = await markMessageSeen({
      chatId: req.params.id,
      messageId: req.params.msgId,
      userId: req.user._id,
    });
    return res.status(200).json({ message: "message seen", data: message });
  } catch (error) {
    return next(error);
  }
};
