const TypingState = require("../models/Typingstate");

// --------------------------------------
// SET TYPING STATUS
// --------------------------------------
exports.setTyping = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, isTyping } = req.body;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "conversationId missing" });
    }

    const state = await TypingState.findOneAndUpdate(
      { conversationId, userId },
      {
        isTyping,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, state });

  } catch (err) {
    console.error("setTyping error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------
// GET TYPING STATUS OF THE OTHER USER
// --------------------------------------
exports.getTypingStatus = async (req, res) => {
  try {
    const myId = req.user.id;
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ success: false, message: "conversationId missing" });
    }

    // Find typing states in this conversation EXCEPT the requesting user
    const states = await TypingState.find({
      conversationId,
      userId: { $ne: myId }
    });

    // If the other user typed >10 seconds ago, hide typing bubble
    const now = Date.now();
    const isTyping = states.some(s => s.isTyping && (now - s.updatedAt.getTime()) < 10000);

    return res.json({ success: true, isTyping });

  } catch (err) {
    console.error("getTypingStatus error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
