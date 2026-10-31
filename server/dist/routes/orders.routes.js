import { Router } from "express";
import { createOrderSchema } from "../schemas/order.schema.js";
import { processOrderRequest } from "../services/order.js";
import { orderRateLimiter } from "../middleware/rateLimiters.js";
export const ordersRouter = Router();
// POST /api/orders
ordersRouter.post("/", orderRateLimiter, async (req, res, next) => {
    try {
        const validatedInput = createOrderSchema.parse(req.body);
        const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
        const userAgent = req.get("user-agent") || "unknown";
        const idempotencyKey = req.get("Idempotency-Key") || undefined;
        const orderResult = await processOrderRequest(validatedInput, {
            clientIp,
            userAgent,
            idempotencyKey,
        });
        res.status(201).json(orderResult);
    }
    catch (error) {
        next(error);
    }
});
