import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('src/config/.env') });

import Http from 'http';
import express from 'express';
import mongoose from 'mongoose';

import bootstrap from './src/app.controller.js';
import { initSocket } from './src/sockets/socket.js';

const app = express();
const port = process.env.port || 3000;

bootstrap(app, port);

const server = Http.createServer(app);
const io = initSocket(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Is the server already running?`);
  } else {
    console.error('HTTP server error:', err.message);
  }
  process.exit(1);
});

server.listen(port, () => console.log(`Server is running on port: ${port}`));

// ── Graceful shutdown ──
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  io.close();
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } catch {
      /* ignore */
    }
    console.log('Closed HTTP server, Socket.IO, and MongoDB connection.');
    process.exit(0);
  });
  // Force-exit if something hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
