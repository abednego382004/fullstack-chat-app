import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Used to store online users
const userSocketMap = {}; // { userId: socketId }
console.log("🔍 Current User Socket Map:", userSocketMap);

io.on("connection", (socket) => {
  console.log("✅ Is Socket Connected?", socket.connected);
  console.log("⚡ A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("🕵️‍♂️ Extracted userId from socket:", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`✅ User ${userId} is online`);
  }
  console.log("🔍 Full User Socket Map after connection:", userSocketMap);

  // Emit list of online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(
        "🔄 Updated User Socket Map after disconnection:",
        userSocketMap
      );
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export function getREceiverSocketId(userId) {
  return userSocketMap[userId];
}

export { io, app, server };
