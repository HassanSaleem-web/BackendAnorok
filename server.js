// server.js
const mongoose = require('mongoose');
const logger = require('./utils/logger');
require('dotenv').config();

// Ensure critical environment variables exist
const { env } = require('./config/env');
const app = require('./app');

const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;

let server;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('✅ Connected to MongoDB');

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err, stack: err.stack }, `❌ MongoDB connection error`);
    process.exit(1);
  });

// ----------------------------------------------------
// ✅ GRACEFUL SHUTDOWN & UNCAUGHT EXCEPTION HANDLING
// ----------------------------------------------------

process.on('uncaughtException', (err) => {
  logger.fatal({ err, stack: err.stack }, 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.fatal({ err, stack: err.stack }, 'UNHANDLED REJECTION! 💥 Shutting down...');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

const gracefulShutdown = () => {
  logger.info('SIGTERM/SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
