import { z } from "zod";
export const contactMessageSchema = z.object({
    name: z.string().trim().min(1, "Enter your name."),
    email: z.string().trim().email("Enter a valid email."),
    subject: z.string().trim().min(1, "Add a subject."),
    message: z.string().trim().min(10, "Tell us a little more (10+ characters)."),
});
export const newsletterSchema = z.object({
    email: z.string().trim().email("That email doesn't look right."),
    source: z.string().optional().default("footer"),
});
export const adminLoginSchema = z.object({
    email: z.string().trim().email("Enter a valid admin email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
});
export const affiliateClickSchema = z.object({
    productSlug: z.string().min(1),
    retailer: z.string().min(1),
    attribution: z.record(z.string()).optional(),
});
