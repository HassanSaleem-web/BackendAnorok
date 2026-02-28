const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    // Generate a unique request ID
    req.id = req.headers['x-request-id'] || randomUUID();

    // Attach request id to response headers so client can trace it
    res.setHeader('X-Request-Id', req.id);

    const start = Date.now();

    // Log when request comes in (debug level, mostly for deep diving)
    logger.debug(`[${req.id}] Incoming Request: ${req.method} ${req.originalUrl}`);

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            requestId: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip || req.socket?.remoteAddress,
            userAgent: req.get('user-agent') || 'unknown',
        };

        if (res.statusCode >= 500) {
            logger.error(`[${req.id}] Request Failed: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(`[${req.id}] Request Warning: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logData);
        } else {
            logger.info(`[${req.id}] Request Success: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, logData);
        }
    });

    next();
};

module.exports = requestLogger;
