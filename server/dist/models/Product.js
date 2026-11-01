import mongoose, { Schema } from "mongoose";
const ProductSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
        type: String,
        required: true,
        enum: ["Tops", "Shirts", "Bottoms", "Dresses", "Footwear", "Accessories"],
        index: true,
    },
    subcategory: { type: String, required: true, trim: true },
    gender: {
        type: String,
        required: true,
        enum: ["women", "men", "unisex"],
        index: true,
    },
    retailer: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0, index: true },
    originalPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                if (value === undefined || value === null)
                    return true;
                let price;
                if (this && typeof this.getUpdate === "function") {
                    const update = this.getUpdate();
                    price = update?.price ?? update?.$set?.price;
                    if (price === undefined)
                        return true;
                }
                else {
                    price = this?.price;
                }
                return price !== undefined ? value > price : true;
            },
            message: "originalPrice must be strictly greater than price",
        },
    },
    currency: { type: String, required: true, enum: ["INR"], default: "INR" },
    images: { type: [String], required: true, default: [] },
    availableSizes: { type: [String], default: [] },
    availableColors: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    collectionIds: { type: [String], default: [], index: true },
    affiliateUrl: { type: String, default: null },
    purchaseMode: {
        type: String,
        required: true,
        enum: ["affiliate", "authorized_cod"],
        default: "affiliate",
    },
    productType: {
        type: String,
        enum: ["affiliate", "reseller"],
        default: function () {
            return this && this.purchaseMode === "authorized_cod" ? "reseller" : "affiliate";
        },
        index: true,
    },
    costPrice: {
        type: Number,
        min: 0,
        select: false, // Hidden from customer-facing queries
    },
    stockQuantity: {
        type: Number,
        default: 50,
        min: 0,
        index: true,
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0,
    },
    codEnabled: {
        type: Boolean,
        required: true,
        default: false,
        validate: {
            validator: function (value) {
                let mode;
                if (this && typeof this.getUpdate === "function") {
                    const update = this.getUpdate();
                    mode = update?.purchaseMode ?? update?.$set?.purchaseMode;
                    if (mode === undefined)
                        return true;
                }
                else {
                    mode = this?.purchaseMode;
                }
                return value === (mode === "authorized_cod");
            },
            message: "codEnabled must be true if and only if purchaseMode is authorized_cod",
        },
    },
    shippingCharge: { type: Number, required: true, default: 0, min: 0 },
    inStock: { type: Boolean, required: true, default: true, index: true },
    isFeatured: { type: Boolean, required: true, default: false },
    isNew: { type: Boolean, required: true, default: false, index: true },
    isEditorsPick: { type: Boolean, required: true, default: false },
    material: { type: String, trim: true },
    fit: { type: String, trim: true },
    lastUpdatedAt: {
        type: String,
        required: true,
        default: () => new Date().toISOString(),
    },
}, {
    timestamps: false,
    suppressReservedKeysWarning: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// Pre-save hook: automatically update lastUpdatedAt if price was modified (unless explicitly set)
ProductSchema.pre("save", function (next) {
    if (this.isModified("price") && !this.isModified("lastUpdatedAt")) {
        this.lastUpdatedAt = new Date().toISOString();
    }
    next();
});
// Text index for search functionality across text fields
ProductSchema.index({
    name: "text",
    tags: "text",
    brand: "text",
    retailer: "text",
    category: "text",
    subcategory: "text",
});
ProductSchema.index({ productType: 1, inStock: 1 });
ProductSchema.index({ brand: 1, price: 1 });
ProductSchema.index({ category: 1, gender: 1, inStock: 1 });
export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
