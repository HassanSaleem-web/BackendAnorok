// models/TypingState.js
const mongoose = require("mongoose");

const typingStateSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isTyping: {
      type: Boolean,
      default: false,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: false } // we manually maintain updatedAt
);

// Ensure one typing state per (conversationId, userId)
typingStateSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("TypingState", typingStateSchema);
