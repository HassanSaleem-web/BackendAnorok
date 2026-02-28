const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

exports.logAction = async (userId, action, req = null, options = {}) => {
    try {
        const { resourceId = null, resourceModel = null, metadata = {} } = options;

        let ipAddress = null;
        let userAgent = null;

        if (req) {
            ipAddress = req.ip || req.connection.remoteAddress;
            userAgent = req.get('User-Agent');
        }

        await AuditLog.create({
            userId,
            action,
            resourceId,
            resourceModel,
            metadata,
            ipAddress,
            userAgent
        });

    } catch (error) {
        // We log the error but don't crash the main process if an audit log fails to write
        // In high-compliance environments, you might want this to throw.
        logger.error(`Failed to write audit log for action ${action} by user ${userId}`, error);
    }
};
