# Chat Server with Socket.IO and Prisma ORM

A Node.js chat server with real-time messaging capabilities using Socket.IO and MySQL database connectivity via Prisma ORM.

## Features

- Real-time chat functionality with Socket.IO
- MySQL database connectivity using Prisma ORM
- RESTful API endpoints
- Web-based chat interface
- User management (read-only from existing database)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Access to MySQL database

## Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env` file

## Database Setup

The project connects to an existing MySQL database. Prisma has been configured to:
- Introspect the existing database schema
- Generate client based on existing tables
- Work with read-only operations for demonstration

## Running the Server

```bash
npm start
```

The server will start on port 3001 (http://localhost:3001)

## API Endpoints

### GET /api/users
Retrieve list of users from the database (limited to 10 for demo)

### POST /api/users
Disabled - connects to existing database

### GET /api/messages
Retrieve messages (room-based filtering available)

## Socket.IO Events

### Client to Server:
- `join-room` - Join a chat room
- `send-message` - Send a message to a room
- `typing` - Indicate typing status
- `stop-typing` - Stop typing indication

### Server to Client:
- `receive-message` - Receive new messages
- `user-typing` - Receive typing status updates
- `error` - Error notifications

## Project Structure

```
chatserver/
├── prisma/
│   └── schema.prisma    # Prisma schema (auto-generated from existing DB)
├── public/
│   └── index.html       # Web chat interface
├── server.js           # Main server file
├── .env               # Environment variables
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## Dependencies

- express: Web framework
- socket.io: Real-time communication
- @prisma/client: Database ORM client
- mysql2: MySQL driver
- dotenv: Environment variable management

## Database Connection

The server connects to a remote MySQL database:
- Host: 88.222.212.187
- Port: 3306
- Database: astroremedys
- Credentials: Configured in .env file

## Testing

Visit http://localhost:3001 in your browser to access the chat interface and test the functionality.