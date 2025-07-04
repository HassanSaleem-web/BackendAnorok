// routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatcontroller = require('../controllers/chat.controller.js');

router.post('/', chatcontroller.handleChat);
router.post('/save', chatcontroller.saveChatSession);

router.post('/save', (req, res) => {
    const { session } = req.body;
  
    if (!session || !Array.isArray(session)) {
      return res.status(400).json({ success: false, error: 'Invalid session data' });
    }
  
    console.log('🟢 Chat session received:', session);
  
    // TODO: Save to DB or file if needed
    res.json({ success: true, message: 'Chat session received' });
  });
  
module.exports = router;
