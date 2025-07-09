// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
const typingUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', async (username) => {
    try {
      // Find or create user
      let user = await User.findOne({ username });
      if (!user) {
        user = new User({ username, socketId: socket.id, online: true });
        await user.save();
      } else {
        user.socketId = socket.id;
        user.online = true;
        await user.save();
      }
      // Emit updated user list
      const users = await User.find({ online: true });
      io.emit('user_list', users);
      io.emit('user_joined', { username, id: socket.id });
      console.log(`${username} joined the chat`);
    } catch (err) {
      console.error('User join error:', err);
    }
  });

  // Handle chat messages
  socket.on('send_message', async (messageData) => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      const message = new Message({
        ...messageData,
        sender: user ? user.username : 'Anonymous',
        senderId: socket.id,
        timestamp: new Date(),
      });
      await message.save();
      io.emit('receive_message', message);
    } catch (err) {
      console.error('Send message error:', err);
    }
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      
      if (isTyping) {
        typingUsers[socket.id] = username;
      } else {
        delete typingUsers[socket.id];
      }
      
      io.emit('typing_users', Object.values(typingUsers));
    }
  });

  // Handle private messages
  socket.on('private_message', async ({ to, message }) => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      const messageData = new Message({
        sender: user ? user.username : 'Anonymous',
        senderId: socket.id,
        message,
        timestamp: new Date(),
        isPrivate: true,
      });
      await messageData.save();
      socket.to(to).emit('private_message', messageData);
      socket.emit('private_message', messageData);
    } catch (err) {
      console.error('Private message error:', err);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        user.online = false;
        await user.save();
        io.emit('user_left', { username: user.username, id: socket.id });
        console.log(`${user.username} left the chat`);
      }
      const users = await User.find({ online: true });
      io.emit('user_list', users);
      delete typingUsers[socket.id];
      io.emit('typing_users', Object.values(typingUsers));
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  });

  // Handle joining a room
  socket.on('join_room', async (roomName) => {
    socket.join(roomName);
    // Create room if it doesn't exist
    let room = await Room.findOne({ name: roomName });
    if (!room) {
      room = new Room({ name: roomName });
      await room.save();
    }
    socket.emit('joined_room', roomName);
    // Optionally, send room message history
    const messages = await Message.find({ room: roomName }).sort({ timestamp: 1 }).limit(100);
    socket.emit('room_messages', { room: roomName, messages });
    io.to(roomName).emit('room_user_joined', { username: socket.id, room: roomName });
  });

  // Handle leaving a room
  socket.on('leave_room', (roomName) => {
    socket.leave(roomName);
    io.to(roomName).emit('room_user_left', { username: socket.id, room: roomName });
  });

  // Handle sending a message to a room
  socket.on('send_room_message', async ({ room, message }) => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      const messageData = new Message({
        sender: user ? user.username : 'Anonymous',
        senderId: socket.id,
        message,
        room,
        timestamp: new Date(),
      });
      await messageData.save();
      io.to(room).emit('receive_room_message', messageData);
    } catch (err) {
      console.error('Send room message error:', err);
    }
  });
});

// API routes
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ online: true });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// API endpoint to get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 