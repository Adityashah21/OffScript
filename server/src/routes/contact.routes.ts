import { Router, type Request, type Response, type NextFunction } from "express";
import { contactMessageSchema } from "../schemas/common.schema.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { contactRateLimiter } from "../middleware/rateLimiters.js";
import { notifyContactMessage } from "../services/notify.js";

export const contactRouter = Router();

// POST /api/contact
contactRouter.post(
  "/",
  contactRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = contactMessageSchema.parse(req.body);

      const messageDoc = await ContactMessage.create({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: "new",
      });

      notifyContactMessage(messageDoc).catch((err) =>
        console.error("Async contact notification error:", err)
      );

      res.status(201).json({
        success: true,
        message: "Thank you for getting in touch.",
      });
    } catch (error) {
      next(error);
    }
  }
);
