const chatService = require('../../services/chat.service');
const projectService = require('../../services/project.service');
const axios = require('axios');
const mongoose = require('mongoose');

// Mock external dependencies
jest.mock('axios');

describe('Chat / AI Service', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getChatReply', () => {
        it('should return the text content from the AI completion response', async () => {
            const mockResponse = {
                data: { choices: [{ message: { content: 'Hello, how can I help?' } }] }
            };
            axios.post.mockResolvedValueOnce(mockResponse);

            const reply = await chatService.getChatReply('Hi AI');
            expect(reply).toBe('Hello, how can I help?');
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(axios.post).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/chat/completions',
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should throw an error if user message is missing', async () => {
            await expect(chatService.getChatReply('')).rejects.toThrow('Missing user message');
        });
    });

    describe('saveChatAsProject', () => {
        it('should trigger project parsing and pass formatted data to projectService', async () => {
            const mockChat = [
                { role: 'user', content: 'Build a robot' },
                { role: 'assistant', content: 'Good idea.' }
            ];

            const mockAIResponseText = `Title: Robot Builder
Summary: A great project to build specialized robots for cleaning.
Milestones:
1. Assembly
Description: Put it together.
2. Coding
Description: Write the brain.`;

            axios.post.mockResolvedValueOnce({
                data: { choices: [{ message: { content: mockAIResponseText } }] }
            });

            // The DB project service call will actually execute against MongoMemoryServer!
            const project = await chatService.saveChatAsProject(userId, mockChat);

            expect(project).toBeDefined();
            expect(project.projectName).toBe('Robot Builder');
            expect(project.chatSummary).toMatch(/A great project to build specialized robots for cleaning./);
            expect(project.milestones).toHaveLength(2);
            expect(project.milestones[0].title).toBe('Assembly');
            expect(project.milestones[0].description).toBe('Put it together.');
            expect(project.milestones[1].title).toBe('Coding');
            expect(project.userId.toString()).toBe(userId);
        });

        it('should throw an error if chat history is not an array', async () => {
            await expect(chatService.saveChatAsProject(userId, "Just a string")).rejects.toThrow('Chat session must be an array');
        });
    });
});
