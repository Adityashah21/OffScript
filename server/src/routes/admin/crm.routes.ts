import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { ContactMessage } from "../../models/ContactMessage.js";
import { NewsletterSubscriber } from "../../models/NewsletterSubscriber.js";
import { AppError } from "../../middleware/errorHandler.js";

export const adminCrmRouter = Router();

const updateMessageStatusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});

const escapeCsv = (str: string | number | boolean | undefined | null) => {
  if (str === undefined || str === null) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
};

// GET /api/admin/crm/contact/export
adminCrmRouter.get("/contact/export", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });

    const headers = ["Name", "Email", "Subject", "Message", "Status", "Date"];
    const rows = messages.map((m) =>
      [
        escapeCsv(m.name),
        escapeCsv(m.email),
        escapeCsv(m.subject),
        escapeCsv(m.message),
        escapeCsv(m.status),
        escapeCsv(m.createdAt?.toISOString()),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="contact-messages.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/crm/contact
adminCrmRouter.get("/contact", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.status && typeof req.query.status === "string") {
      filter.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
    ]);

    res.json({
      items: items.map((m) => m.toJSON()),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/crm/contact/:id/status
adminCrmRouter.patch("/contact/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = updateMessageStatusSchema.parse(req.body);

    const message = await ContactMessage.findById(req.params.id);
    if (!message) {
      throw new AppError(404, "MESSAGE_NOT_FOUND", "Contact message not found");
    }

    message.status = status;
    await message.save();

    res.json(message.toJSON());
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/crm/newsletter/export
adminCrmRouter.get("/newsletter/export", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await NewsletterSubscriber.find().sort({ createdAt: -1 });

    const headers = ["Email", "Source", "Unsubscribed", "Date"];
    const rows = subs.map((s) =>
      [
        escapeCsv(s.email),
        escapeCsv(s.source),
        escapeCsv(s.unsubscribed),
        escapeCsv(s.createdAt?.toISOString()),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="newsletter-subscribers.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/crm/newsletter
adminCrmRouter.get("/newsletter", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.unsubscribed !== undefined) {
      filter.unsubscribed = req.query.unsubscribed === "true";
    }

    const [items, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NewsletterSubscriber.countDocuments(filter),
    ]);

    res.json({
      items: items.map((s) => s.toJSON()),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});
