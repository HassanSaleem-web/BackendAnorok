const messageService = require("../services/message.service");

exports.startConversation = async (req, res) => {
  try {
    const conversation = await messageService.startConversation(req.user.id, req.body.receiverId);
    return res.json({ success: true, conversation });
  } catch (err) {
    console.error("Error starting conversation:", err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, message } = req.body;
    const newMessage = await messageService.sendMessage(req.user.id, conversationId, receiverId, message);
    return res.status(201).json({ success: true, newMessage });
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { cursor, limit } = req.query;
    const { messages, nextCursor } = await messageService.getMessages(req.params.conversationId, cursor, limit);
    return res.status(200).json({ success: true, messages, nextCursor });
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await messageService.markAsRead(req.user.id, req.body.conversationId);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to mark messages as read" });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const { cursor, limit } = req.query;
    const { conversations, nextCursor } = await messageService.getUserConversations(req.user.id, cursor, limit);
    return res.status(200).json({ success: true, conversations, nextCursor });
  } catch (error) {
    console.error("getUserConversations error:", error);
    res.status(error.status || 500).json({ message: error.message || "Internal server error" });
  }
};
