const express = require("express");
const auth = require("../middleware/auth.middleware.js");
const  upload = require("../middleware/upload.middleware.js");
const uploadChatAttachment = require("../controllers/chatUpload.controller.js");

// … existing routes …


const {
  startConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  markAsRead,
  
} = require("../controllers/messages.controller.js");

const router = express.Router();

router.post("/start", auth, startConversation);
router.post("/send", auth, sendMessage);
router.get("/:conversationId", auth, getMessages);
router.get("/", auth, getUserConversations);
// Mark messages as read
router.post("/read", auth, markAsRead);
router.post("/upload", upload.single("file"), uploadChatAttachment);

module.exports = router;
