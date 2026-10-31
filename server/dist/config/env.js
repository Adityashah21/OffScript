import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(5000),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/offscript"),
    CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    ADMIN_EMAIL: z.string().email().default("admin@offscript.in"),
    ADMIN_PASSWORD: z.string().min(6).default("adminpassword123"),
    PUBLIC_BASE_URL: z.string().url().default("http://localhost:5000"),
    NOTIFY_EMAIL: z.string().email().optional(),
    RESEND_API_KEY: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid environment variables");
}
export const env = parsed.data;
