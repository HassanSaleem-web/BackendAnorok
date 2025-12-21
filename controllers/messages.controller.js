const Conversation = require("../models/Conversation.js");
const Message = require("../models/Message.js");

/**
 * Start or Fetch a Conversation
 */
exports.startConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const myId = req.user.id;

    if (!receiverId)
      return res
        .status(400)
        .json({ success: false, message: "receiverId missing" });

    // Find existing conversation between both users
    let conversation = await Conversation.findOne({
      participants: { $all: [myId, receiverId] },
    });

    // Create if none exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, receiverId],
        lastMessage: "",
        updatedAt: Date.now(),
      });
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (err) {
    console.error("Error starting conversation:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Send a Message
 */
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { conversationId, receiverId, message } = req.body;

    if (!conversationId || !receiverId || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId,
      message,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message,
      updatedAt: Date.now(),
    });

    return res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get Messages of a Conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId || conversationId === "null") {
      return res.status(400).json({
        success: false,
        message: "Invalid conversationId",
      });
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all Conversations of Logged-In User
 */
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    let conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "fullName email");

    // Normalize participant IDs to strings
    const formatted = conversations.map((conv) => ({
      _id: conv._id,
      lastMessage: conv.lastMessage,
      updatedAt: conv.updatedAt,
      participants: conv.participants.map((u) => ({
        _id: u._id.toString(),
        fullName: u.fullName,
        email: u.email,
      })),
    }));

    return res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    console.error("getUserConversations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    // Mark all messages from the OTHER user as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        read: false
      },
      { $set: { read: true } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message
    });
  }
};

/**
 * Get all Conversations of Logged-In User
 */
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    let conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "fullName email");

    const formatted = [];

    for (const conv of conversations) {
      // Fetch the LAST message
      const lastMsg = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .lean();

      // Count UNREAD messages from the OTHER user
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: userId },
        read: false
      });

      formatted.push({
        _id: conv._id,
        participants: conv.participants.map((u) => ({
          _id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
        })),

        lastMessage: lastMsg ? lastMsg.message : "",
        lastMessageSender: lastMsg ? lastMsg.senderId.toString() : null,
        lastMessageRead: lastMsg ? lastMsg.read : true,

        unreadCount,
        unread: unreadCount > 0,

        updatedAt: conv.updatedAt
      });
    }

    return res.status(200).json({ success: true, conversations: formatted });
  } catch (error) {
    console.error("getUserConversations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
