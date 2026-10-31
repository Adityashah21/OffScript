import { z } from "zod";
export const PRODUCT_CATEGORIES = [
    "Tops",
    "Shirts",
    "Bottoms",
    "Dresses",
    "Footwear",
    "Accessories",
];
export const PRODUCT_GENDERS = ["women", "men", "unisex"];
export const PURCHASE_MODES = ["affiliate", "authorized_cod"];
export const productSchema = z
    .object({
    id: z.string().optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(PRODUCT_CATEGORIES),
    subcategory: z.string().min(1),
    gender: z.enum(PRODUCT_GENDERS),
    retailer: z.string().min(1),
    brand: z.string().min(1),
    price: z.number().int().nonnegative(),
    originalPrice: z.number().int().positive().optional(),
    currency: z.literal("INR").default("INR"),
    images: z.array(z.string()).min(1),
    availableSizes: z.array(z.string()).default([]),
    availableColors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    collectionIds: z.array(z.string()).default([]),
    affiliateUrl: z.string().url().nullable().default(null),
    purchaseMode: z.enum(PURCHASE_MODES).default("affiliate"),
    codEnabled: z.boolean().default(false),
    shippingCharge: z.number().int().nonnegative().default(0),
    inStock: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isEditorsPick: z.boolean().default(false),
    material: z.string().optional(),
    fit: z.string().optional(),
    lastUpdatedAt: z.string().default(() => new Date().toISOString()),
})
    .refine((data) => data.codEnabled === (data.purchaseMode === "authorized_cod"), {
    message: "codEnabled must be true if and only if purchaseMode is authorized_cod",
    path: ["codEnabled"],
})
    .refine((data) => data.originalPrice === undefined || data.originalPrice > data.price, {
    message: "originalPrice must be strictly greater than price",
    path: ["originalPrice"],
});
