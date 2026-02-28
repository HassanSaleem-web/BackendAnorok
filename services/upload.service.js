const cloudinary = require("../config/cloudinary");

exports.uploadChatAttachment = async (file) => {
    if (!file) {
        const error = new Error("No file uploaded");
        error.status = 400;
        throw error;
    }

    const fileType = file.mimetype;

    const result = await cloudinary.uploader.upload(file.path, {
        folder: "genex_chat",
        resource_type: "auto",
    });

    let messageType = "file";
    if (fileType.startsWith("image/")) messageType = "image";
    else if (fileType.startsWith("video/")) messageType = "video";

    return {
        url: result.secure_url,
        public_id: result.public_id,
        messageType,
    };
};
