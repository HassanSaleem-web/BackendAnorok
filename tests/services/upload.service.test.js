const uploadService = require('../../services/upload.service');
const cloudinary = require('../../config/cloudinary');

jest.mock('../../config/cloudinary', () => ({
    uploader: {
        upload: jest.fn()
    }
}));

describe('Upload Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadChatAttachment', () => {
        it('should correctly upload an image and return formatted Cloudinary data', async () => {
            const mockFile = {
                path: '/tmp/test-image.jpg',
                mimetype: 'image/jpeg'
            };

            const mockUploadResult = {
                secure_url: 'https://res.cloudinary.com/test-url.jpg',
                public_id: 'test_id_123'
            };

            cloudinary.uploader.upload.mockResolvedValueOnce(mockUploadResult);

            const result = await uploadService.uploadChatAttachment(mockFile);

            expect(result.url).toBe(mockUploadResult.secure_url);
            expect(result.public_id).toBe(mockUploadResult.public_id);
            expect(result.messageType).toBe('image');
            expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockFile.path, {
                folder: 'genex_chat',
                resource_type: 'auto'
            });
        });

        it('should assign a messageType of video if the mimetype is a video', async () => {
            const mockFile = {
                path: '/tmp/test-video.mp4',
                mimetype: 'video/mp4'
            };

            cloudinary.uploader.upload.mockResolvedValueOnce({
                secure_url: '...',
                public_id: '...'
            });

            const result = await uploadService.uploadChatAttachment(mockFile);
            expect(result.messageType).toBe('video');
        });

        it('should throw an error if no file object is provided', async () => {
            await expect(uploadService.uploadChatAttachment(null)).rejects.toThrow('No file uploaded');
        });
    });
});
