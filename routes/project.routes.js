// project.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const { saveOrUpdateProject, getMyProjects } = require('../controllers/project.controller');

// -----------------------------------------
// GET ALL PROJECTS FOR LOGGED-IN USER
// -----------------------------------------
router.get('/', auth, getMyProjects);

// -----------------------------------------
// CREATE or UPDATE PROJECT
// -----------------------------------------
router.post('/save', auth, saveOrUpdateProject);

module.exports = router;
