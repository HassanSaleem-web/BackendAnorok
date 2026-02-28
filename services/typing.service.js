const TypingState = require("../models/Typingstate");

exports.setTypingStatus = async (userId, conversationId, isTyping) => {
    if (!conversationId) {
        const error = new Error("conversationId missing");
        error.status = 400;
        throw error;
    }

    const state = await TypingState.findOneAndUpdate(
        { conversationId, userId },
        {
            isTyping,
            updatedAt: Date.now()
        },
        { upsert: true, new: true }
    );

    return state;
};

exports.getOtherUserTypingStatus = async (userId, conversationId) => {
    if (!conversationId) {
        const error = new Error("conversationId missing");
        error.status = 400;
        throw error;
    }

    const states = await TypingState.find({
        conversationId,
        userId: { $ne: userId }
    });

    const now = Date.now();
    const isTyping = states.some(s => s.isTyping && (now - s.updatedAt.getTime()) < 10000);

    return isTyping;
};
