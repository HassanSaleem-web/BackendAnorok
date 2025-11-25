const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const { setTyping, getTypingStatus } = require("../controllers/typing.controller");

// Set typing: POST /api/typing
router.post("/", authMiddleware, setTyping);

// Get typing status: GET /api/typing/:conversationId
router.get("/:conversationId", authMiddleware, getTypingStatus);

module.exports = router;
