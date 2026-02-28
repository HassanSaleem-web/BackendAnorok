const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'USER_LOGIN',
            'USER_LOGOUT',
            'USER_SIGNUP',
            'PASSWORD_CHANGE',
            'PROJECT_CREATED',
            'PROJECT_UPDATED',
            'LISTING_CREATED',
            'LISTING_UPDATED',
            'BID_PLACED',
            'BID_ACCEPTED',
            'PAYMENT_INITIATED',
            'PAYMENT_COMPLETED'
        ],
        index: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        // Can refer to Project, Listing, Bid, etc based on action
        default: null
    },
    resourceModel: {
        type: String,
        enum: ['Project', 'Listing', 'Bid', 'User', null],
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // flexible for JSON data (e.g IP address, old value, new value)
        default: {}
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, { timestamps: true });

// Prevent modification of historical audit logs
auditLogSchema.pre('findOneAndUpdate', function (next) {
    this.options.runValidators = true;
    next(new Error("Audit logs cannot be modified"));
});

auditLogSchema.pre('updateOne', function (next) {
    next(new Error("Audit logs cannot be modified"));
});

auditLogSchema.pre('updateMany', function (next) {
    next(new Error("Audit logs cannot be modified"));
});

auditLogSchema.pre('deleteOne', function (next) {
    next(new Error("Audit logs cannot be deleted"));
});

auditLogSchema.pre('deleteMany', function (next) {
    next(new Error("Audit logs cannot be deleted"));
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
