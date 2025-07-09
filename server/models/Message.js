const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  senderId: { type: String },
  message: { type: String, required: true },
  room: { type: String },
  timestamp: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema); 