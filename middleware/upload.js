const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "genex_projects",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});
const message = new CloudinaryStorage({
  cloudinary,
 // remove allowed_formats completely
params: {
  folder: "UserMessage",
  resource_type: "auto"
}

});
const upload = multer({ storage, message });

module.exports = upload;
