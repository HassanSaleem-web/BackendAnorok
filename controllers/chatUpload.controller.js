const uploadService = require('../services/upload.service');

const uploadChatAttachment = async (req, res) => {
  try {
    const result = await uploadService.uploadChatAttachment(req.file);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

module.exports = uploadChatAttachment;
