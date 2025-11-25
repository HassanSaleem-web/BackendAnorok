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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
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
  
  status: {
    type: String,
    enum: ["live", "listed"],
    default: "live"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
