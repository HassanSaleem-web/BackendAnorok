const { z } = require("zod");

const signupSchema = z.object({
    body: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
        email: z.string().email("Invalid email address").max(150),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[\W_]/, "Password must contain at least one special character"),
        role: z.enum(["user", "admin", "moderator"]).optional()
    }),
    query: z.any(),
    params: z.any()
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required")
    }),
    query: z.any(),
    params: z.any()
});

module.exports = {
    signupSchema,
    loginSchema
};
