const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const backupDir = path.join(__dirname, '../backups');

const runBackup = async () => {
    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        console.log('🔄 Connecting to MongoDB for backup extraction...');
        await mongoose.connect(process.env.MONGO_URI);

        const collections = ['users', 'projects', 'listings', 'bids', 'conversations', 'messages', 'auditlogs'];

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `db-snapshot-${timestamp}.json`);

        const dump = {};

        for (const modelName of collections) {
            console.log(`📦 Exporting collection: ${modelName}`);
            // Access native raw collection data
            const items = await mongoose.connection.collection(modelName).find({}).toArray();
            dump[modelName] = items;
        }

        fs.writeFileSync(backupPath, JSON.stringify(dump, null, 2));

        console.log(`✅ Backup completed successfully. Snapshot saved to ${backupPath}`);

    } catch (error) {
        console.error('❌ Backup Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from DB.');
        process.exit(0);
    }
};

runBackup();
