const cloudinary = require("../config/cloudinary");

// Controller to upload chat attachments
const uploadChatAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // File info
    const file = req.file;
    const fileType = file.mimetype;

    // Upload to Cloudinary (multer-storage-cloudinary already stores it)
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "genex_chat",
      resource_type: "auto", // supports images, pdfs, videos
    });

    // Determine messageType
    let messageType = "file";
    if (fileType.startsWith("image/")) messageType = "image";
    else if (fileType.startsWith("video/")) messageType = "video";

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      messageType,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

module.exports = uploadChatAttachment;
