require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { authenticateSocketToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  },
  allowRequest: (req, callback) => {
    // This will be handled by the authenticateSocketToken middleware
    callback(null, true);
  }
});

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Socket.IO connections with authentication
io.use(authenticateSocketToken);

io.on('connection', (socket) => {
  console.log('Authenticated user connected:', socket.id, socket.user);

  // Join room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { content, roomId } = data;
      
      // Create message object without database save
      const message = {
        content,
        roomId,
        createdAt: new Date(),
        id: Date.now() // Simple ID generation
      };

      // Broadcast to room
      io.to(roomId).emit('receive-message', message);
      console.log(`Message sent to room ${roomId}: ${content}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      isTyping: true
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      username: data.username,
      isTyping: false
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3002;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testDatabaseConnection();
});