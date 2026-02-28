const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

// Pino logger configuration
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    // Format timestamp as ISO string instead of epoch
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level(label) {
            return { level: label.toUpperCase() };
        }
    },
    ...(isProduction ? {} : {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            }
        }
    })
});

module.exports = logger;
