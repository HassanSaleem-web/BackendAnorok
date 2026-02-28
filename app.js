const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const xss = require('./middleware/xss.middleware');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 👉 NEW: Observability Tools
const Sentry = require("@sentry/node");
const promBundle = require("express-prom-bundle");

// Initialize Sentry early
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Tracing
    tracesSampleRate: 1.0,
  });
}

// Existing routes
const chatRoutes = require('./routes/chat.routes');
const projectRoutes = require('./routes/project.routes');
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require("./routes/listing.routes");
const typingroute = require("./routes/typing.routes")
// 👉 NEW: Messages routes (user-to-user chat)
const messagesRoutes = require("./routes/messages.routes");

const app = express();

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
        // Must reflect the exact origin when credentials: true
        callback(null, origin || true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Set secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows images to be loaded from other origins if needed
}));

// -----------------------------------------------
// ✅ CDN & STATIC ASSET CACHING
// -----------------------------------------------
app.use('/uploads', express.static('uploads', {
  maxAge: '1y', // Cache images for 1 year
  etag: true,   // Let browsers validate caches effectively
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Metric Collection for Prometheus (/metrics endpoint automatically exposed)
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { project_name: 'GeneX_Backend' },
  promClient: { collectDefaultMetrics: {} }
});
app.use(metricsMiddleware);

// Rate Limiting (apply to all /api routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 150, // limit each IP to 150 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

const requestLogger = require('./middleware/logger.middleware');
const logger = require('./utils/logger'); // Import the new Pino logger

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Sanitize user inputs to prevent XSS
app.use(xss);

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

// 👉 NEW: Health & Reliability Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// The error handler must be before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global Error Handler
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
