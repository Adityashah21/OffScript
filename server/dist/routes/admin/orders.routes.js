import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Order } from "../../models/Order.js";
import { ORDER_STATUSES } from "../../schemas/order.schema.js";
import { AppError } from "../../middleware/errorHandler.js";
export const adminOrdersRouter = Router();
export function formatAdminOrder(o) {
    const json = typeof o?.toJSON === "function" ? o.toJSON() : o;
    if (!json)
        return json;
    const items = [
        {
            productId: json.product?.productId || json.product?.slug || "piece",
            title: json.product?.name || json.product?.slug || "Piece",
            brand: "OFFSCRIPT",
            price: json.product?.unitPrice || json.itemTotal || 0,
            quantity: json.quantity || 1,
            selectedSize: json.size,
            selectedColor: json.color,
            imageUrl: json.product?.image || "",
        },
    ];
    const fullName = json.customer?.fullName || json.customer?.name || "Customer";
    const mobile = json.customer?.mobile || json.customer?.phone || "";
    const email = json.customer?.email || "";
    const addr = json.customer?.address || json.deliveryAddress || {};
    const customer = {
        ...json.customer,
        name: fullName,
        fullName,
        phone: mobile,
        mobile,
        email,
        address: addr,
    };
    const deliveryAddress = {
        line1: addr.house || addr.line1 || "",
        line2: addr.street || addr.line2 || "",
        landmark: addr.landmark || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pin || addr.pincode || "",
    };
    const total = json.grandTotal ?? json.total ?? ((json.itemTotal || 0) + (json.shipping || 0));
    const subtotal = json.itemTotal ?? json.subtotal ?? 0;
    const shippingFee = json.shipping ?? json.shippingFee ?? 0;
    return {
        ...json,
        _id: String(json._id || json.id || json.ref),
        id: String(json.id || json._id || json.ref),
        items,
        customer,
        deliveryAddress,
        total,
        subtotal,
        shippingFee,
        paymentMethod: "cod",
    };
}
const ALLOWED_TRANSITIONS = {
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
function buildOrderFilter(query) {
    const filter = {};
    if (query.status && typeof query.status === "string" && query.status !== "all") {
        filter.status = query.status;
    }
    const from = query.from || query.startDate;
    const to = query.to || query.endDate;
    if (from || to) {
        const dateFilter = {};
        if (typeof from === "string" && from) {
            dateFilter.$gte = new Date(from);
        }
        if (typeof to === "string" && to) {
            dateFilter.$lte = new Date(to);
        }
        filter.createdAt = dateFilter;
    }
    const rawSearch = typeof query.search === "string" ? query.search : typeof query.query === "string" ? query.query : "";
    if (rawSearch.trim()) {
        const s = rawSearch.trim();
        filter.$or = [
            { ref: { $regex: s, $options: "i" } },
            { "customer.mobile": { $regex: s, $options: "i" } },
            { "customer.fullName": { $regex: s, $options: "i" } },
        ];
    }
    return filter;
}
// GET /api/admin/orders/export (CSV export)
adminOrdersRouter.get("/export", async (req, res, next) => {
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
        const escapeCsv = (str) => {
            if (str === undefined || str === null)
                return '""';
            const val = String(str).replace(/"/g, '""');
            return `"${val}"`;
        };
        const rows = orders.map((o) => [
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
        ].join(","));
        const csvContent = [headers.join(","), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
        res.status(200).send(csvContent);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/admin/orders
adminOrdersRouter.get("/", async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
        const skip = (page - 1) * limit;
        const filter = buildOrderFilter(req.query);
        const [items, total, pendingCount, confirmedCount, shippedCount, deliveredCount, cancelledCount, rtoCount,] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Order.countDocuments(filter),
            Order.countDocuments({ status: "pending" }),
            Order.countDocuments({ status: "confirmed" }),
            Order.countDocuments({ status: "shipped" }),
            Order.countDocuments({ status: "delivered" }),
            Order.countDocuments({ status: "cancelled" }),
            Order.countDocuments({ status: "rto" }),
        ]);
        const formattedItems = items.map(formatAdminOrder);
        res.json({
            data: formattedItems,
            items: formattedItems,
            total,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1,
                statusCounts: {
                    pending: pendingCount,
                    confirmed: confirmedCount,
                    shipped: shippedCount,
                    delivered: deliveredCount,
                    cancelled: cancelledCount,
                    rto: rtoCount,
                },
            },
            page,
            limit,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/admin/orders/:ref
adminOrdersRouter.get("/:ref", async (req, res, next) => {
    try {
        const rawRef = req.params.ref;
        const idOrRef = (Array.isArray(rawRef) ? rawRef[0] : rawRef) || "";
        const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
        const order = await Order.findOne({
            $or: [{ ref: idOrRef }, ...(isObjectId ? [{ _id: idOrRef }] : [])],
        });
        if (!order) {
            throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
        }
        const formatted = formatAdminOrder(order);
        res.json({
            data: formatted,
            ...formatted,
        });
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/admin/orders/:ref/status
adminOrdersRouter.patch("/:ref/status", async (req, res, next) => {
    try {
        const { status: newStatus, note } = updateStatusSchema.parse(req.body);
        const rawRef = req.params.ref;
        const idOrRef = (Array.isArray(rawRef) ? rawRef[0] : rawRef) || "";
        const isObjectId = mongoose.Types.ObjectId.isValid(idOrRef);
        const order = await Order.findOne({
            $or: [{ ref: idOrRef }, ...(isObjectId ? [{ _id: idOrRef }] : [])],
        });
        if (!order) {
            throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
        }
        const currentStatus = order.status;
        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            throw new AppError(400, "INVALID_STATUS_TRANSITION", `Cannot transition order from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none (terminal status)"}`);
        }
        order.status = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            note: note || `Status updated from ${currentStatus} to ${newStatus}`,
        });
        await order.save();
        const formatted = formatAdminOrder(order);
        res.json({
            data: formatted,
            ...formatted,
        });
    }
    catch (error) {
        next(error);
    }
});
