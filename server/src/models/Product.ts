import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export interface IProduct {
  slug: string;
  name: string;
  description: string;
  category: "Tops" | "Shirts" | "Bottoms" | "Dresses" | "Footwear" | "Accessories";
  subcategory: string;
  gender: "women" | "men" | "unisex";
  retailer: string;
  brand: string;
  price: number;
  originalPrice?: number;
  currency: "INR";
  images: string[];
  availableSizes: string[];
  availableColors: string[];
  tags: string[];
  collectionIds: string[];
  affiliateUrl: string | null;
  purchaseMode: "affiliate" | "authorized_cod";
  codEnabled: boolean;
  shippingCharge: number;
  inStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isEditorsPick: boolean;
  material?: string;
  fit?: string;
  lastUpdatedAt: string;
}

export type ProductDocument = HydratedDocument<IProduct>;

const ProductSchema = new Schema<IProduct>(
  {
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
        validator: function (this: any, value?: number) {
          if (value === undefined || value === null) return true;
          let price: number | undefined;
          if (this && typeof this.getUpdate === "function") {
            const update = this.getUpdate();
            price = update?.price ?? update?.$set?.price;
            if (price === undefined) return true;
          } else {
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
    codEnabled: {
      type: Boolean,
      required: true,
      default: false,
      validate: {
        validator: function (this: any, value: boolean) {
          let mode: string | undefined;
          if (this && typeof this.getUpdate === "function") {
            const update = this.getUpdate();
            mode = update?.purchaseMode ?? update?.$set?.purchaseMode;
            if (mode === undefined) return true;
          } else {
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
  },
  {
    timestamps: false,
    suppressReservedKeysWarning: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook: automatically update lastUpdatedAt if price was modified (unless explicitly set)
ProductSchema.pre("save", function (this: ProductDocument, next) {
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

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
