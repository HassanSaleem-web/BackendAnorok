const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, optimisticConcurrency: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 }); // Optimize loading chat history
MessageSchema.index({ receiverId: 1, read: 1 }); // Optimize unread message counts

module.exports = mongoose.model("Message", MessageSchema);
