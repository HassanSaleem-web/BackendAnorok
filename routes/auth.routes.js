const express = require('express');
const router = express.Router();
const { signup, login, getMe, getUserById, updateProfile, deleteAccount } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), signup);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);
router.get('/user/:id', authMiddleware, getUserById);

// PUT /api/auth/profile
router.put('/profile', authMiddleware, updateProfile);

// DELETE /api/auth/me
router.delete('/me', authMiddleware, deleteAccount);

module.exports = router;
