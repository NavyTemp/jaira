import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import UserModel from "../models/user.model.js";
import RevokedTokenModel from "../models/revokedtoken.model.js";
import ChatModel from "../models/chat.model.js";
import { getRoleSecrets } from "../utlis/token/roleSecret.js";

let io;

/**
 * Build the CORS origin option from CLIENT_ORIGIN.
 *  - unset / "*"  -> allow everything (handy in dev)
 *  - "a,b,c"      -> allow that explicit list
 */
const parseOrigins = () => {
  const raw = process.env.CLIENT_ORIGIN;
  if (!raw || raw === "*") return "*";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * A JWT may be signed with either the user or the admin secret. We read the
 * (unverified) payload first to learn the role, then verify with the matching
 * secret so a forged token still fails verification.
 */
const verifyAnyRole = (token) => {
  const preview = jwt.decode(token);
  const secret = getRoleSecrets(preview?.userrole);
  return jwt.verify(token, secret);
};

const isParticipant = (chat, userId) =>
  chat.participants.some((p) => p.toString() === userId.toString());

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: parseOrigins(),
      credentials: true,
    },
  });

  // ── Handshake authentication (mirrors the REST `authentication` middleware) ──
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAnyRole(token);

      const revoked = await RevokedTokenModel.findOne({ tokenId: decoded.jti });
      if (revoked) {
        return next(new Error("Token revoked, please login again"));
      }

      const user = await UserModel.findById(decoded.userId).select("-password");
      if (!user || user.isDeleted) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      return next();
    } catch (error) {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // Personal room: notifications, task updates, cross-chat "new message" pings.
    socket.join(`user:${socket.userId}`);
    socket.emit("connected", { userId: socket.userId });

    // ── Join a chat room (only if you're a participant) ──
    socket.on("chat:join", async (chatId, ack) => {
      try {
        const chat = await ChatModel.findById(chatId).select("participants");
        if (!chat || !isParticipant(chat, socket.userId)) {
          if (typeof ack === "function") ack({ ok: false, error: "forbidden" });
          return;
        }
        socket.join(`chat:${chatId}`);
        if (typeof ack === "function") ack({ ok: true });
      } catch {
        if (typeof ack === "function") ack({ ok: false, error: "join failed" });
      }
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ── Send a message over the socket (persists + broadcasts) ──
    socket.on("message:send", async (payload = {}, ack) => {
      try {
        const { createMessage } = await import(
          "../modules/chat/chat.service.js"
        );
        const message = await createMessage({
          chatId: payload.chatId,
          senderId: socket.userId,
          text: payload.text,
          attachments: payload.attachments,
        });
        if (typeof ack === "function") ack({ ok: true, message });
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error.message || "send failed" });
        }
      }
    });

    // ── Typing indicator (transient, not persisted) ──
    socket.on("message:typing", ({ chatId, typing } = {}) => {
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit("message:typing", {
        chatId,
        userId: socket.userId,
        name: socket.user?.name,
        typing: Boolean(typing),
      });
    });

    // ── Read receipt ──
    socket.on("message:seen", async ({ chatId, messageId } = {}, ack) => {
      try {
        const { markMessageSeen } = await import(
          "../modules/chat/chat.service.js"
        );
        await markMessageSeen({
          chatId,
          messageId,
          userId: socket.userId,
        });
        if (typeof ack === "function") ack({ ok: true });
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error.message || "seen failed" });
        }
      }
    });

    socket.on("disconnect", () => {
      // socket.io auto-leaves rooms; nothing extra needed for now.
    });
  });

  console.log("Socket.IO initialized");
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/** Emit an event to a single user's personal room (all their devices). */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

/** Emit an event to everyone currently in a chat room. */
export const emitToChat = (chatId, event, payload) => {
  if (!io || !chatId) return;
  io.to(`chat:${chatId.toString()}`).emit(event, payload);
};
