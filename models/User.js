// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
 

  // Optional: keep googleId if you ever re-add Google login in future
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true,
  },

  createdAt: { 
    type: Date, 
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
