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
const allowedOrigins = [
  'https://dashboard-duh5.onrender.com',
  'http://localhost:5500',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: false,
}));

// Session & Passport middleware must come FIRST
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Now register your routes AFTER session & passport
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);


module.exports = app;
