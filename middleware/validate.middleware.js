// middleware/validate.middleware.js
const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
    try {
        const validatedData = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        // Replace with sanitized & validated data
        req.body = validatedData.body;
        req.query = validatedData.query;
        req.params = validatedData.params;

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod errors nicely
            const errorMessages = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            res.status(400);
            return next(new Error(`Validation failed: ${JSON.stringify(errorMessages)}`));
        }
        next(error);
    }
};

module.exports = validate;
