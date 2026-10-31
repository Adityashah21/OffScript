import { Router } from "express";
import { newsletterSchema } from "../schemas/common.schema.js";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber.js";
import { newsletterRateLimiter } from "../middleware/rateLimiters.js";
import { AppError } from "../middleware/errorHandler.js";
export const newsletterRouter = Router();
// POST /api/newsletter
newsletterRouter.post("/", newsletterRateLimiter, async (req, res, next) => {
    try {
        const data = newsletterSchema.parse(req.body);
        const email = data.email.toLowerCase().trim();
        const existing = await NewsletterSubscriber.findOne({ email });
        if (existing) {
            if (existing.unsubscribed) {
                existing.unsubscribed = false;
                await existing.save();
            }
        }
        else {
            await NewsletterSubscriber.create({
                email,
                source: data.source || "footer",
            });
        }
        // Re-subscribing an existing email must return success without leaking whether it already existed
        res.status(200).json({
            success: true,
            message: "Thank you for subscribing to OFFSCRIPT.",
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/newsletter/unsubscribe?token=
newsletterRouter.get("/unsubscribe", async (req, res, next) => {
    try {
        const token = typeof req.query.token === "string" ? req.query.token : undefined;
        if (!token) {
            throw new AppError(400, "TOKEN_REQUIRED", "Unsubscribe token is required");
        }
        const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });
        if (!subscriber) {
            throw new AppError(404, "TOKEN_NOT_FOUND", "Invalid or expired unsubscribe link");
        }
        subscriber.unsubscribed = true;
        await subscriber.save();
        res.status(200).json({
            success: true,
            message: "You have been unsubscribed from OFFSCRIPT updates.",
        });
    }
    catch (error) {
        next(error);
    }
});
