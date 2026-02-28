const typingService = require('../../services/typing.service');
const TypingState = require('../../models/Typingstate');
const mongoose = require('mongoose');

describe('Typing Service', () => {
    const userA = new mongoose.Types.ObjectId().toString();
    const userB = new mongoose.Types.ObjectId().toString();
    const conversationId = new mongoose.Types.ObjectId().toString();

    beforeEach(async () => {
        await TypingState.deleteMany({});
    });

    describe('setTypingStatus', () => {
        it('should create or update a typing state for a user', async () => {
            const state = await typingService.setTypingStatus(userA, conversationId, true);

            expect(state).toBeDefined();
            expect(state.userId.toString()).toBe(userA);
            expect(state.conversationId.toString()).toBe(conversationId);
            expect(state.isTyping).toBe(true);

            // Update it back to false
            const newState = await typingService.setTypingStatus(userA, conversationId, false);
            expect(newState.isTyping).toBe(false);
        });

        it('should throw Error if conversationId is missing', async () => {
            await expect(typingService.setTypingStatus(userA, null, true)).rejects.toThrow('conversationId missing');
        });
    });

    describe('getOtherUserTypingStatus', () => {
        it('should return true if the OTHER user is typing within the 10 second window', async () => {
            await typingService.setTypingStatus(userA, conversationId, true);

            // Check from User B's perspective
            const isTyping = await typingService.getOtherUserTypingStatus(userB, conversationId);
            expect(isTyping).toBe(true);
        });

        it('should return false if the only person typing is the user themselves', async () => {
            // User A is typing
            await typingService.setTypingStatus(userA, conversationId, true);

            // User A checks if the OTHER person is typing
            const isTyping = await typingService.getOtherUserTypingStatus(userA, conversationId);
            expect(isTyping).toBe(false); // Shouldn't see their own typing status
        });

        it('should return false if the typing state is older than 10 seconds (stale)', async () => {
            // Manually insert a stale record simulating an abandoned session
            await TypingState.create({
                userId: userA,
                conversationId,
                isTyping: true,
                updatedAt: new Date(Date.now() - 15000) // 15 seconds ago
            });

            const isTyping = await typingService.getOtherUserTypingStatus(userB, conversationId);
            expect(isTyping).toBe(false); // Ignored due to stale timeout
        });
    });
});
