const messageService = require('../../services/message.service');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const mongoose = require('mongoose');

describe('Message Service', () => {
    const userA = new mongoose.Types.ObjectId().toString();
    const userB = new mongoose.Types.ObjectId().toString();
    const userC = new mongoose.Types.ObjectId().toString();

    describe('startConversation', () => {
        it('should create a new conversation between two users if none exists', async () => {
            const conversation = await messageService.startConversation(userA, userB);

            expect(conversation).toBeDefined();
            expect(conversation.participants).toHaveLength(2);
            expect(conversation.participants.map(p => p.toString())).toContain(userA);
            expect(conversation.participants.map(p => p.toString())).toContain(userB);
        });

        it('should return the existing conversation if one already exists', async () => {
            const firstCall = await messageService.startConversation(userA, userB);
            const secondCall = await messageService.startConversation(userA, userB);

            expect(firstCall._id.toString()).toBe(secondCall._id.toString());
        });

        it('should throw Error if receiverId is missing', async () => {
            await expect(messageService.startConversation(userA, null)).rejects.toThrow('receiverId missing');
        });
    });

    describe('sendMessage', () => {
        let conversationId;

        beforeEach(async () => {
            const conv = await messageService.startConversation(userA, userB);
            conversationId = conv._id.toString();
        });

        it('should emit a new message and update the conversations lastMessage tracker', async () => {
            const msgText = 'Hello World!';
            const message = await messageService.sendMessage(userA, conversationId, userB, msgText);

            expect(message).toBeDefined();
            expect(message.senderId.toString()).toBe(userA);
            expect(message.message).toBe(msgText);
            expect(message.read).toBe(false);

            // Verify conversation update
            const updatedConv = await Conversation.findById(conversationId);
            expect(updatedConv.lastMessage).toBe(msgText);
        });
    });

    describe('markAsRead', () => {
        let conversationId;

        beforeEach(async () => {
            const conv = await messageService.startConversation(userA, userB);
            conversationId = conv._id.toString();
            await messageService.sendMessage(userA, conversationId, userB, 'Msg 1');
            await messageService.sendMessage(userA, conversationId, userB, 'Msg 2');
        });

        it('should mark all unread messages from the sender as read when the receiver views them', async () => {
            // User B reads User A's messages
            const result = await messageService.markAsRead(userB, conversationId);
            expect(result).toBe(true);

            const unreadMessages = await Message.countDocuments({ conversationId, read: false });
            expect(unreadMessages).toBe(0);
        });

        it('should NOT mark messages as read if the sender triggers the action themselves accidentally', async () => {
            // User A (sender) cannot mark their own sent messages as 'read' by the other person
            await messageService.markAsRead(userA, conversationId);

            const unreadMessages = await Message.countDocuments({ conversationId, read: false });
            expect(unreadMessages).toBe(2);
        });
    });
});
