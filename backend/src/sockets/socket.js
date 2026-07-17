import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  console.log("Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log("New socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
