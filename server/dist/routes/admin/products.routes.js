import { Router } from "express";
import { z } from "zod";
import { Product } from "../../models/Product.js";
import { productSchema } from "../../schemas/product.schema.js";
import { AppError } from "../../middleware/errorHandler.js";
export const adminProductsRouter = Router();
const updatePriceSchema = z
    .object({
    price: z.number().int().nonnegative(),
    originalPrice: z.number().int().positive().optional(),
})
    .refine((data) => data.originalPrice === undefined || data.originalPrice > data.price, {
    message: "originalPrice must be strictly greater than price",
    path: ["originalPrice"],
});
const bulkStockSchema = z.object({
    slugs: z.array(z.string().min(1)).min(1),
    inStock: z.boolean(),
});
// GET /api/admin/products
adminProductsRouter.get("/", async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
        const skip = (page - 1) * limit;
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.inStock !== undefined) {
            filter.inStock = req.query.inStock === "true";
        }
        if (typeof req.query.q === "string" && req.query.q.trim()) {
            const q = req.query.q.trim();
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { brand: { $regex: q, $options: "i" } },
                { slug: { $regex: q, $options: "i" } },
            ];
        }
        const [items, total] = await Promise.all([
            Product.find(filter).sort({ lastUpdatedAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);
        res.json({
            items: items.map((p) => p.toJSON()),
            total,
            page,
            limit,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/admin/products
adminProductsRouter.post("/", async (req, res, next) => {
    try {
        const data = productSchema.parse(req.body);
        const existing = await Product.findOne({ slug: data.slug });
        if (existing) {
            throw new AppError(409, "SLUG_EXISTS", "A product with this slug already exists");
        }
        const product = new Product(data);
        await product.save();
        res.status(201).json(product.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/admin/products/bulk-stock
adminProductsRouter.patch("/bulk-stock", async (req, res, next) => {
    try {
        const { slugs, inStock } = bulkStockSchema.parse(req.body);
        const result = await Product.updateMany({ slug: { $in: slugs } }, { $set: { inStock } });
        res.json({
            success: true,
            modifiedCount: result.modifiedCount,
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/admin/products/:slug
adminProductsRouter.get("/:slug", async (req, res, next) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
        }
        res.json(product.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/admin/products/:slug
adminProductsRouter.put("/:slug", async (req, res, next) => {
    try {
        const data = productSchema.parse(req.body);
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
        }
        // If slug changed, verify new slug doesn't collide
        if (data.slug !== req.params.slug) {
            const collision = await Product.findOne({ slug: data.slug });
            if (collision) {
                throw new AppError(409, "SLUG_EXISTS", "New slug already in use");
            }
        }
        Object.assign(product, data);
        await product.save();
        res.json(product.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/admin/products/:slug/price
adminProductsRouter.patch("/:slug/price", async (req, res, next) => {
    try {
        const { price, originalPrice } = updatePriceSchema.parse(req.body);
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
        }
        product.price = price;
        if (originalPrice !== undefined) {
            product.originalPrice = originalPrice;
        }
        product.lastUpdatedAt = new Date().toISOString();
        await product.save();
        res.json(product.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/admin/products/:slug
adminProductsRouter.delete("/:slug", async (req, res, next) => {
    try {
        const product = await Product.findOneAndDelete({ slug: req.params.slug });
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
        }
        res.json({ success: true, deletedSlug: req.params.slug });
    }
    catch (error) {
        next(error);
    }
});
