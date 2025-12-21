// project.routes.js
const express = require('express');
const router = express.Router();

const Project = require('../models/Project');
const auth = require('../middleware/auth.middleware');
const { saveOrUpdateProject } = require('../controllers/project.controller');

// -----------------------------------------
// GET ALL PROJECTS FOR LOGGED-IN USER
// -----------------------------------------
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, projects });

  } catch (err) {
    console.error('❌ Error fetching projects:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// -----------------------------------------
// CREATE or UPDATE PROJECT
// -----------------------------------------
router.post('/save', auth, saveOrUpdateProject);

module.exports = router;
