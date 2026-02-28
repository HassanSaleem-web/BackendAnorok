require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // using Pino logger for structured output

/**
 * Enterprise Safe Migration Strategy
 * ----------------------------------
 * 1. Back up db before applying via mongodump.
 * 2. Run this script locally against a Staging clone.
 * 3. Never mutate arrays or delete data without a $set backup field.
 * 4. Use lean() queries and bulkWrite() to stay off the event loop memory limits.
 */

const MONGO_URI = process.env.MONGO_URI;

const dbMigration_AddFields = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB for Database Migration');

        // 1. Target the collection avoiding overhead of Mongoose Document validation/hooks
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // 2. Perform the safe bulk operation
        // E.g. add a 'status' field to all older users who do not have it
        const result = await usersCollection.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active', migrationDate: new Date() } }
        );

        logger.info(`Migration Complete: Modified ${result.modifiedCount} documents.`);

    } catch (error) {
        logger.error({ err: error }, 'Migration failed critically!');
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info('Gracefully disconnected from MongoDB.');
        process.exit(0);
    }
};

dbMigration_AddFields();
