const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  step: Number,
  title: String,
  description: String,
  completed: {
    type: Boolean,
    default: false
  }
});

const projectSchema = new mongoose.Schema({
  // 🔹 CURRENT OWNER (changes after sale)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 🔹 ORIGINAL CREATOR (immutable)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true   // prevents modification after creation
  },

  username: {
    type: String,
    required: false
  },

  message: {
    type: String,
    required: true
  },

  projectName: {
    type: String,
    required: true
  },

  projectLogo: {
    type: String
  },

  chatSummary: {
    type: String,
    required: true
  },

  milestones: [milestoneSchema],
  tools: [String],

  // 🔹 PROJECT STATUS
  status: {
    type: String,
    enum: ["live", "listed"],
    default: "live"
  },

  // 🔹 OPTIONAL: OWNERSHIP HISTORY (for tracking transfers)
  ownershipHistory: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
