const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./Models/msgModel");

const corsOptions = {
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST"],
};


const app = express();

const users = {}
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

function getUserSocketId(Rid) {
  console.log("users", users)
  return users[Rid]
}
// On user connection
io.on("connection", (socket) => {

  socket.on("register", (userId) => {
    if (!userId || users[userId]) {
      return;
    }
    users[userId] = socket.id;
    console.log("User connected", userId, socket.id,users);
    io.emit("getOnlineUsers", Object.keys(users));
  });

  socket.on("isTyping", ({ chatId, Rid }) => {
    const receiverSocketId = getUserSocketId(Rid)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", chatId)
    }
  })

  socket.on("stoppedTyping", ({ chatId, Rid }) => {
    const receiverSocketId = getUserSocketId(Rid)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopped Typing", chatId)
    }
  })

  socket.on("msgsRead", async ({ chatId, Rid,userId }) => {
    const receiverSocketId = getUserSocketId(Rid)
    await Message.updateMany({ chatId: chatId, sender: { $ne: userId } },
      { $set: { isRead: true } });
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("markRead", chatId)
    }
  })

  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        io.emit("getOnlineUsers", Object.keys(users));
        break;
      }
    }
  });
});


module.exports = { app, server, io, corsOptions, getUserSocketId }