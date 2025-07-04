// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  fullName: String,
  email: { type: String, required: true, unique: true },
  profilePicture: String,
  role: { type: String, default: 'inventor' }, // default role
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
