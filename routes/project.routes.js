const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { saveOrUpdateProject } = require('../controllers/project.controller');




// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('❌ Error fetching projects:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/save', saveOrUpdateProject);
module.exports = router;
