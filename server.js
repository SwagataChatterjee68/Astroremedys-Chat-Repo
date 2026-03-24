require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

// TEMP: comment auth for debugging
const { authenticateSocketToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Initialize Prisma
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
// app.use(express.static('public'));

// Test route
app.get("/", (req, res) => {
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
    socket.on("join-room", (roomId) => {
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
    socket.on("send-message", async (data) => {
        console.log("SEND MESSAGE EVENT RECEIVED");
        console.log("DATA:", data);

        try {
            console.log("Constructed message object:", data);

            const receiverId = data.roomId.split("_")[1];

            // 2. Find if the user is an astrologer or not
            const astrologer = await prisma.astrologers.findFirst({
                where: { userId: BigInt(receiverId) },
            });

            const userType = astrologer ? 1 : 0;

            // Save message to database
            const savedMessage = await prisma.chats.create({
                data: {
                    senderId: data.senderId,
                    senderName: data.senderName,
                    receiverId: BigInt(receiverId),
                    message: data.content,
                    type: !!userType,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            });

            console.log("Message saved to DB with ID:", savedMessage);

            console.log("Broadcasting message to room:", data.roomId);

            // Handle BigInt serialization for socket emission
            const messageToEmit = JSON.parse(
                JSON.stringify(savedMessage, (key, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            );

            // Add content field for client compatibility and emit
            const finalData = {
                ...messageToEmit,
                content: messageToEmit.message,
            };

            io.to(data.roomId).emit("receive-message", finalData);

            console.log("Message broadcasted successfully");
        } catch (error) {
            console.log("ERROR SENDING MESSAGE:", error);

            socket.emit("error", {
                message: "Message send failed",
            });
        }
    });

    // Typing
    socket.on("typing", (data) => {
        console.log("TYPING EVENT:", data);

        socket.to(data.roomId).emit("user-typing", data);
    });

    socket.on("stop-typing", (data) => {
        console.log("STOP TYPING EVENT:", data);

        socket.to(data.roomId).emit("user-typing", data);
    });

    // Listen all events
    socket.onAny((event, ...args) => {
        console.log("EVENT RECEIVED:", event);
        console.log("ARGS:", args);
    });

    // Disconnect
    socket.on("disconnect", (reason) => {
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
