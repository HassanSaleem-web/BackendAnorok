const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const chatRoutes = require('./routes/chat.routes');
const projectRoutes = require('./routes/project.routes');

require('dotenv').config();
require('./auth/google.strategy');

const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());

// ✅ CORS middleware should come BEFORE routes
app.use(cors({
  origin: 'https://dashboard-duh5.onrender.com',
  methods: ['GET', 'POST'],
  credentials: false
}));

// ✅ Now register your routes
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // change to true with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

module.exports = app;
