/**
 * Manual Socket.IO smoke test.
 *
 * The socket server now requires a valid JWT in the handshake, so pass an
 * access token (from a login response) via env or argv:
 *
 *   TOKEN=<jwt> node test-socket.js
 *   node test-socket.js <jwt> [chatId]
 *
 * It connects, prints connection status, and logs any realtime events it
 * receives (notifications, new messages, task updates). If a chatId is given
 * it also joins that chat room.
 */
import { io } from "socket.io-client";

const token = process.env.TOKEN || process.argv[2];
const chatId = process.argv[3];
const url = process.env.SOCKET_URL || "http://localhost:3000";

if (!token) {
  console.error("No token provided. Usage: TOKEN=<jwt> node test-socket.js");
  process.exit(1);
}

const socket = io(url, { auth: { token }, transports: ["websocket"] });

socket.on("connect", () => {
  console.log("Connected successfully:", socket.id);
  if (chatId) {
    socket.emit("chat:join", chatId, (ack) =>
      console.log("chat:join ack:", ack),
    );
  }
});

socket.on("connected", (payload) => console.log("server hello:", payload));
socket.on("notification:new", (n) => console.log("notification:new:", n));
socket.on("message:new", (m) => console.log("message:new:", m.text));
socket.on("chat:message", (p) => console.log("chat:message ping:", p.chatId));
socket.on("task:updated", (p) => console.log("task:updated:", p.taskId));

socket.on("connect_error", (error) => {
  console.log("Connection error:", error.message);
});

socket.on("disconnect", (reason) => console.log("disconnected:", reason));
