require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

// TEMP: comment auth for debugging
// const { authenticateSocketToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Prisma
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Test route
app.get('/', (req, res) => {
  res.send("Socket.IO server is running");
});

// ===== DEBUG CONNECTION LOGGER =====
io.on("connection", (socket) => {

  console.log("=================================");
  console.log("SOCKET CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("Handshake Query:", socket.handshake.query);
  console.log("Handshake Auth:", socket.handshake.auth);
  console.log("Client IP:", socket.handshake.address);
  console.log("=================================");

  // Join room
  socket.on('join-room', (roomId) => {

    console.log("JOIN ROOM EVENT RECEIVED");
    console.log("Room ID:", roomId);

    socket.join(roomId);

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("mark-read", (data) => {
  const { roomId, userId } = data;

  console.log(`Mark read received from ${userId} in room ${roomId}`);

  socket.to(roomId).emit("messages-read", {
    roomId,
    userId,
  });
});

  // Send message
  socket.on('send-message', (data) => {

    console.log("SEND MESSAGE EVENT RECEIVED");
    console.log("DATA:", data);

    try {

      const message = {
        id: Date.now(),
        content: data.content,
        roomId: data.roomId,
        senderId: data.senderId,
        createdAt: new Date()
      };

      console.log("Constructed message object:", message);

      console.log("Broadcasting message to room:", data.roomId);

      io.to(data.roomId).emit('receive-message', message);

      console.log("Message broadcasted successfully");

    } catch (error) {

      console.log("ERROR SENDING MESSAGE:", error);

      socket.emit('error', {
        message: "Message send failed"
      });
    }
  });

  // Typing
  socket.on('typing', (data) => {

    console.log("TYPING EVENT:", data);

    socket.to(data.roomId).emit('user-typing', data);
  });

  socket.on('stop-typing', (data) => {

    console.log("STOP TYPING EVENT:", data);

    socket.to(data.roomId).emit('user-typing', data);
  });

  // Listen all events
  socket.onAny((event, ...args) => {

    console.log("EVENT RECEIVED:", event);
    console.log("ARGS:", args);

  });

  // Disconnect
  socket.on('disconnect', (reason) => {

    console.log("=================================");
    console.log("SOCKET DISCONNECTED");
    console.log("Socket ID:", socket.id);
    console.log("Reason:", reason);
    console.log("=================================");

  });

});

// DB test
async function testDatabaseConnection() {

  try {

    await prisma.$connect();

    console.log("DATABASE CONNECTED SUCCESSFULLY");

  } catch (error) {

    console.log("DATABASE CONNECTION FAILED:", error.message);

  }

}

// Start server on all interfaces
const PORT = process.env.PORT || 3031;

server.listen(PORT, "0.0.0.0", async () => {

  console.log("=================================");
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  console.log("=================================");

  await testDatabaseConnection();

});