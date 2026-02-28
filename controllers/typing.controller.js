const typingService = require('../services/typing.service');

exports.setTyping = async (req, res) => {
  try {
    const state = await typingService.setTypingStatus(req.user.id, req.body.conversationId, req.body.isTyping);
    return res.json({ success: true, state });
  } catch (err) {
    console.error("setTyping error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
  }
};

exports.getTypingStatus = async (req, res) => {
  try {
    const isTyping = await typingService.getOtherUserTypingStatus(req.user.id, req.params.conversationId);
    return res.json({ success: true, isTyping });
  } catch (err) {
    console.error("getTypingStatus error:", err);
    res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
  }
};
