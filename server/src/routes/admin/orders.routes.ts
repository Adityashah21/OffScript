import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { Order } from "../../models/Order.js";
import { ORDER_STATUSES } from "../../schemas/order.schema.js";
import { AppError } from "../../middleware/errorHandler.js";

export const adminOrdersRouter = Router();

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "rto"],
  delivered: [],
  cancelled: [],
  rto: [],
};

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

function buildOrderFilter(query: Request["query"]) {
  const filter: Record<string, unknown> = {};

  if (query.status && typeof query.status === "string") {
    filter.status = query.status;
  }

  if (query.from || query.to) {
    const dateFilter: Record<string, Date> = {};
    if (typeof query.from === "string") {
      dateFilter.$gte = new Date(query.from);
    }
    if (typeof query.to === "string") {
      dateFilter.$lte = new Date(query.to);
    }
    filter.createdAt = dateFilter;
  }

  if (typeof query.search === "string" && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { ref: { $regex: s, $options: "i" } },
      { "customer.mobile": { $regex: s, $options: "i" } },
      { "customer.fullName": { $regex: s, $options: "i" } },
    ];
  }

  return filter;
}

// GET /api/admin/orders/export (CSV export)
adminOrdersRouter.get("/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildOrderFilter(req.query);
    const orders = await Order.find(filter).sort({ createdAt: -1 });

    const headers = [
      "Reference",
      "Date",
      "Status",
      "Customer Name",
      "Mobile",
      "Email",
      "House",
      "Street",
      "City",
      "State",
      "PIN",
      "Product Name",
      "Product Slug",
      "Size",
      "Color",
      "Qty",
      "Item Total",
      "Shipping",
      "Grand Total",
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = orders.map((o) =>
      [
        escapeCsv(o.ref),
        escapeCsv(o.createdAt?.toISOString()),
        escapeCsv(o.status),
        escapeCsv(o.customer.fullName),
        escapeCsv(o.customer.mobile),
        escapeCsv(o.customer.email || ""),
        escapeCsv(o.customer.address.house),
        escapeCsv(o.customer.address.street),
        escapeCsv(o.customer.address.city),
        escapeCsv(o.customer.address.state),
        escapeCsv(o.customer.address.pin),
        escapeCsv(o.product.name),
        escapeCsv(o.product.slug),
        escapeCsv(o.size || ""),
        escapeCsv(o.color),
        escapeCsv(o.quantity),
        escapeCsv(o.itemTotal),
        escapeCsv(o.shipping),
        escapeCsv(o.grandTotal),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders
adminOrdersRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter = buildOrderFilter(req.query);

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      items: items.map((o) => o.toJSON()),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/:ref
adminOrdersRouter.get("/:ref", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findOne({ ref: req.params.ref });
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
    }
    res.json(order.toJSON());
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/orders/:ref/status
adminOrdersRouter.patch("/:ref/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status: newStatus, note } = updateStatusSchema.parse(req.body);

    const order = await Order.findOne({ ref: req.params.ref });
    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    const currentStatus = order.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new AppError(
        400,
        "INVALID_STATUS_TRANSITION",
        `Cannot transition order from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none (terminal status)"}`
      );
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated from ${currentStatus} to ${newStatus}`,
    });

    await order.save();

    res.json(order.toJSON());
  } catch (error) {
    next(error);
  }
});
