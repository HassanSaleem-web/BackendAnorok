// middleware/error.middleware.js

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error({ err, stack: err.stack }, "Global Server Error Caught by Middleware");

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
