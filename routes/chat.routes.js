// routes/chat.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const chatcontroller = require('../controllers/chat.controller.js');

// -------------------------------------------
// 1️⃣ Handle chat message (LLM interaction)
// -------------------------------------------
router.post('/', auth, chatcontroller.handleChat);

// -------------------------------------------
// 2️⃣ Save chat session OR generate project
// (depending on chatcontroller.saveChatSession)
// -------------------------------------------
router.post('/save', auth, chatcontroller.saveChatSession);

module.exports = router;
