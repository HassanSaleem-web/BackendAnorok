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
  username: {
    type: String,
    required: false // could be replaced with session ID or email later
  },
  title: {
    type: String,
    required: true
  },
  chatSummary: {
    type: String,
    required: true
  },
  milestones: [milestoneSchema],
  tools: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
