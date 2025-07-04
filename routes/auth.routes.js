const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/failure',
  }),
  (req, res) => {
    res.redirect('http://localhost:50945/');
  }
);

router.get('/success', (req, res) => {
  res.json({ message: 'Logged in with Google', user: req.user });
});

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Google login failed' });
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
