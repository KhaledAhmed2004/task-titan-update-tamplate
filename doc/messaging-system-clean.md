# Real-Time Messaging System (Express + Socket.IO + MongoDB)

A modular, production-ready messaging system supporting private and group chats, multi-device presence, per-recipient delivery/seen tracking, typing indicators, and optional MongoDB persistence. Designed for easy integration into any backend and frontend.

## Introduction

This system enables real-time text-based messaging with Socket.IO and optional MongoDB persistence. It supports one-to-one and group conversations, online/offline status, last seen, and message lifecycle states (sent, delivered, seen). The design emphasizes separation between server initialization and Socket.IO logic, consistent event naming, and secure authentication via JWT.

## System Overview

- Room-based messaging for private and group chats.
- Message lifecycle: sent → delivered → seen.
- Online/offline + last seen tracking.
- Multi-device login per user (track multiple sockets per user).
- Typing indicators (typing, stopTyping events).
- Structured error handling (coded responses).
- Optional MongoDB persistence for messages and statuses.
- Scalable group management endpoints.

## Features

- Real-time private and group messaging.
- Multi-device presence with accurate last seen.
- Per-recipient delivery and seen tracking.
- Typing indicators for UX.
- JWT-based authentication for socket connections.
- Group management: create, add, remove members.
- Logging via console/Winston with coded error emissions.

## Architecture & Technical Details

### Folder Structure
```
messaging-system/
│
├─ server.js             # Express server bootstrapping, Socket.IO init
├─ utils/
│   └─ socket.js         # Socket.IO core events and logic
├─ models/
│   └─ messageModel.js   # MongoDB message persistence (optional)
└─ controllers/
    └─ messageController.js # Optional message API for persistence
```

### Server Setup (`server.js`)
```js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./utils/socket');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
initSocket(server);

app.get('/', (req, res) => res.send('Messaging system running!'));

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Socket.IO Core (`utils/socket.js`)
```js
let io;
const onlineUsers = {}; // { userId: [socketId1, socketId2, ...] }

const initSocket = (server) => {
  io = require('socket.io')(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('userOnline', (userId) => {
      if (onlineUsers[userId]) onlineUsers[userId].push(socket.id);
      else onlineUsers[userId] = [socket.id];
      io.emit('updateUserStatus', { userId, status: 'online' });
    });

    socket.on('joinRoom', (roomId) => socket.join(roomId));

    socket.on('sendMessage', ({ roomId, sender, message }) => {
      const msgData = { roomId, sender, message, timestamp: new Date(), status: 'sent' };
      io.to(roomId).emit('receiveMessage', msgData);

      const clients = io.sockets.adapter.rooms.get(roomId);
      if (clients) {
        clients.forEach((socketId) => {
          if (socketId !== socket.id) io.to(socketId).emit('messageDelivered', msgData);
        });
      }
    });

    socket.on('messageSeen', ({ roomId, messageId, userId }) => {
      io.to(roomId).emit('messageSeen', { messageId, userId });
    });

    socket.on('typing', ({ roomId, userId }) => io.to(roomId).emit('userTyping', { userId }));
    socket.on('stopTyping', ({ roomId, userId }) => io.to(roomId).emit('userStopTyping', { userId }));

    socket.on('disconnect', () => {
      const userId = Object.keys(onlineUsers).find(key => onlineUsers[key].includes(socket.id));
      if (userId) {
        onlineUsers[userId] = onlineUsers[userId].filter(id => id !== socket.id);
        if (!onlineUsers[userId].length) {
          delete onlineUsers[userId];
          io.emit('updateUserStatus', { userId, status: 'offline', lastSeen: new Date() });
        }
      }
    });
  });
};

module.exports = { initSocket };
```

### Room Strategy
- Private: `roomId = [user1Id, user2Id].sort().join('_')`
- Group: `roomId = groupId`

### MongoDB Message Model (optional)
```js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  statuses: [
    { userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum: ['delivered', 'seen'] }, timestamp: Date }
  ],
  createdAt: { type: Date, default: Date.now }
});
```

### Security & Authorization
- Validate JWT from `socket.handshake.auth.token` and assign `socket.userId`.
- Authorize room joins based on membership.
- Prevent userId spoofing by deriving identity from token.

### Error Handling & Logging
- Wrap async operations in `try/catch` and emit coded errors: `{ code, message }`.
- Use console or Winston for logging.

## User Flow
- Authenticate socket (if enabled) and mark user online.
- Join private/group room.
- Send message (broadcast as sent); recipients reflect delivered/seen.
- Emit `messageSeen` when opened; server updates room.
- Typing indicators via `typing`/`stopTyping`.
- Disconnect updates online/offline and last seen (multi-device aware).

## Frontend Integration (Example)
```js
import { io } from 'socket.io-client';
const token = localStorage.getItem('token');

const socket = io('http://localhost:5000', { auth: { token } });

socket.emit('joinRoom', roomId);

socket.emit('sendMessage', { roomId, sender: currentUserId, message: 'Hello!' });

socket.on('receiveMessage', (msg) => console.log('Received:', msg));

socket.on('messageDelivered', (msg) => console.log('Delivered:', msg));

socket.on('messageSeen', ({ messageId, userId }) => console.log(`Seen: ${messageId} by ${userId}`));

socket.on('updateUserStatus', ({ userId, status, lastSeen }) => console.log(userId, status, lastSeen));

socket.on('error', ({ code, message }) => console.error(`Error [${code}]: ${message}`));
```

## REST API Endpoints (from doc examples)
- `POST /api/groups/create`
- `POST /api/groups/add-member`
- `POST /api/groups/remove-member`

Example `removeMember` controller:
```js
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Room.findByIdAndUpdate(
      groupId,
      { $pull: { members: userId } },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.status(200).json(group);
  } catch (error) {
    console.error('RemoveMember Error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
};
```

## Scalability & Best Practices
- Use Redis for online user tracking at scale.
- Persist `lastSeen` via heartbeat or on disconnect.
- Store timestamps in UTC and convert on frontend.
- Use MongoDB `_id` as `messageId` for reliable tracking.

## Conclusion

A robust, modular messaging foundation: private & group chat, multi-device presence, per-recipient statuses, optional persistence, JWT-ready security, and clear event design.

## Summary of Changes
- Removed repeated setup sections; kept the clean `server.js` + `utils/socket.js` version.
- Consolidated multiple feature overviews into a single list.
- Unified room strategy and event naming (standardized on `receiveMessage`).
- Merged presence, statuses, and typing indicators into one coherent socket module.
- Kept relevant REST endpoints with `removeMember` example; dropped fluff/promo phrasing.
- Ensured consistent tone, terminology, and concise formatting throughout.