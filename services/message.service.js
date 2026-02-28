const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.startConversation = async (userId, receiverId) => {
    if (!receiverId) {
        const error = new Error("receiverId missing");
        error.status = 400;
        throw error;
    }

    // Find existing conversation between both users
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, receiverId] },
    });

    // Create if none exists
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, receiverId],
            lastMessage: "",
            updatedAt: Date.now(),
        });
    }

    return conversation;
};

exports.sendMessage = async (senderId, conversationId, receiverId, message) => {
    if (!conversationId || !receiverId || !message) {
        const error = new Error("Missing required fields");
        error.status = 400;
        throw error;
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

    return newMessage;
};

exports.getMessages = async (conversationId, cursor, limit = 50) => {
    if (!conversationId || conversationId === "null") {
        const error = new Error("Invalid conversationId");
        error.status = 400;
        throw error;
    }

    let query = { conversationId };

    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 }) // Get newest first
        .limit(Number(limit));

    // Reverse to send oldest-to-newest for UI rendering
    messages.reverse();

    const nextCursor = messages.length > 0 ? messages[0].createdAt : null;

    return { messages, nextCursor };
};

exports.markAsRead = async (userId, conversationId) => {
    await Message.updateMany(
        {
            conversationId,
            senderId: { $ne: userId },
            read: false
        },
        { $set: { read: true } }
    );
    return true;
};

exports.getUserConversations = async (userId, cursor, limit = 20) => {
    let query = { participants: userId };

    if (cursor) {
        query.updatedAt = { $lt: new Date(cursor) };
    }

    let conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .populate("participants", "fullName email");

    const formatted = [];

    for (const conv of conversations) {
        const lastMsg = await Message.findOne({ conversationId: conv._id })
            .sort({ createdAt: -1 })
            .lean();

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

    const nextCursor = conversations.length > 0 ? conversations[conversations.length - 1].updatedAt : null;
    return { conversations: formatted, nextCursor };
};
