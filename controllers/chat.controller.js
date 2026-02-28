const chatService = require('../services/chat.service');

exports.handleChat = async (req, res) => {
  try {
    const reply = await chatService.getChatReply(req.body.userMessage);
    res.json({ reply });
  } catch (error) {
    console.error('🔴 Chat error:', error.response?.data || error.message);
    res.status(error.status || 500).json({ error: error.message || 'Chat processing failed' });
  }
};

exports.saveChatSession = async (req, res) => {
  try {
    const project = await chatService.saveChatAsProject(req.user.id, req.body.userMessage);
    res.json({ success: true, project });
  } catch (err) {
    console.error("❌ Error saving chat as project:", err);
    res.status(err.status || 500).json({ success: false, error: err.message || "Failed to save project" });
  }
};
