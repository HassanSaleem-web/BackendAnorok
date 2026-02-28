const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default("5000"),
    MONGO_URI: z.string().url("MONGO_URI must be a valid URL string"),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long for security"),
    OPENROUTER_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
});

function validateEnv() {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Environment Variable Validation Failed:');
        parsed.error.issues.forEach(issue => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });

        // In production, we want to fail fast if config is missing
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }

        return process.env; // Return raw env anyway in dev for flexibility 
    }

    console.log('✅ Environment configuration is valid.');
    return parsed.data;
}

module.exports = {
    validateEnv,
    env: validateEnv(),
};
