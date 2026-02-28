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
    required: true,
    maxlength: 50000 // Limit to prevent 16MB document ballooning
  },

  projectName: {
    type: String,
    required: true,
    maxlength: 100
  },

  projectLogo: {
    type: String
  },

  chatSummary: {
    type: String,
    required: true,
    maxlength: 10000 // Limit summary length
  },

  milestones: [milestoneSchema],
  tools: [{ type: String, maxlength: 50 }], // Limit array string sizes

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
}, { timestamps: true, optimisticConcurrency: true });

// Performance Indexes
projectSchema.index({ userId: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
