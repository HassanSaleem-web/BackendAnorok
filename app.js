const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Existing routes
const chatRoutes = require('./routes/chat.routes');
const projectRoutes = require('./routes/project.routes');
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require("./routes/listing.routes");
const typingroute= require("./routes/typing.routes")
// 👉 NEW: Messages routes (user-to-user chat)
const messagesRoutes = require("./routes/messages.routes");

const app = express();
app.use(express.json());

// -----------------------------------------------
// ✅ CORS CONFIGURATION 
// -----------------------------------------------
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://dashboard-3wi1.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:8080'
];

// Allow undefined origin (curl, mobile apps)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
  })
);

// -----------------------------------------------
// ✅ ROUTES
// -----------------------------------------------
app.use('/api/projects', projectRoutes);
app.use("/api/listings", listingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// 👉 NEW: Messages API
app.use('/api/messages', messagesRoutes);
app.use("/api/typing", typingroute);

module.exports = app;
