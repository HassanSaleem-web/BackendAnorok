const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Storage for chat attachments
const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "UserMessage",       // folder for chat files
    resource_type: "auto",       // <-- REQUIRED to support PDF, video, docs
  },
});

// Multer instance for chat uploads
const chatUpload = multer({ storage: chatStorage });

module.exports = chatUpload;
