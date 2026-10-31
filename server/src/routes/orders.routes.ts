import { Router, type Request, type Response, type NextFunction } from "express";
import { createOrderSchema } from "../schemas/order.schema.js";
import { processOrderRequest, normalizeIndianMobile } from "../services/order.js";
import { orderRateLimiter } from "../middleware/rateLimiters.js";
import { Order } from "../models/Order.js";
import { AppError } from "../middleware/errorHandler.js";

export const ordersRouter = Router();

function formatPublicOrder(order: any) {
  const json = typeof order?.toJSON === "function" ? order.toJSON() : order;
  return {
    ref: json.ref,
    status: json.status,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    product: {
      productId: json.product?.productId || json.product?.slug,
      slug: json.product?.slug,
      name: json.product?.name,
      image: json.product?.image,
      unitPrice: json.product?.unitPrice || json.itemTotal,
      shippingCharge: json.product?.shippingCharge ?? json.shipping ?? 0,
    },
    size: json.size,
    color: json.color,
    quantity: json.quantity,
    itemTotal: json.itemTotal,
    shipping: json.shipping,
    grandTotal: json.grandTotal,
    paymentMode: json.paymentMode || "COD",
    customer: {
      fullName: json.customer?.fullName,
      mobile: json.customer?.mobile,
      email: json.customer?.email || "",
      address: json.customer?.address,
    },
    statusHistory: (json.statusHistory || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp,
      note: h.note,
    })),
  };
}

// POST /api/orders/lookup - Fetch order history & profile by mobile or ref
ordersRouter.post("/lookup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobile, ref } = req.body || {};
    let query: Record<string, any> = {};

    if (ref && typeof ref === "string" && ref.trim()) {
      query = { ref: ref.trim() };
    } else if (mobile && typeof mobile === "string" && mobile.trim()) {
      const normalizedMobile = normalizeIndianMobile(mobile);
      if (normalizedMobile.length < 10) {
        throw new AppError(400, "INVALID_MOBILE", "Enter a valid 10-digit Indian mobile number");
      }
      query = { "customer.mobile": normalizedMobile };
    } else {
      throw new AppError(400, "MISSING_LOOKUP_PARAM", "Please provide a mobile number or order reference");
    }

    const matchedOrders = await Order.find(query).sort({ createdAt: -1 }).limit(50);

    let allOrders = matchedOrders;
    if (ref && matchedOrders.length > 0) {
      const customerMobile = matchedOrders[0].customer?.mobile;
      if (customerMobile) {
        allOrders = await Order.find({ "customer.mobile": customerMobile }).sort({ createdAt: -1 }).limit(50);
      }
    }

    const latestCustomer = allOrders.length > 0 ? allOrders[0].customer : null;

    res.json({
      orders: allOrders.map(formatPublicOrder),
      customer: latestCustomer
        ? {
            fullName: latestCustomer.fullName,
            mobile: latestCustomer.mobile,
            email: latestCustomer.email || "",
            address: latestCustomer.address,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/track/:ref - Track a single order by ref
ordersRouter.get("/track/:ref", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRef = req.params.ref;
    const ref = (Array.isArray(rawRef) ? rawRef[0] : rawRef || "").trim();
    const order = await Order.findOne({ ref });
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", `Order reference '${ref}' not found`);
    }
    res.json(formatPublicOrder(order));
  } catch (error) {
    next(error);
  }
});

// POST /api/orders
ordersRouter.post(
  "/",
  orderRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  }
);
