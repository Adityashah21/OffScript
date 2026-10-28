import mongoose, { Document, Schema, Model } from "mongoose";

export interface IProductSnapshot {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  shippingCharge: number;
}

export interface ICustomerAddress {
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pin: string;
}

export interface ICustomer {
  fullName: string;
  mobile: string;
  email?: string;
  address: ICustomerAddress;
}

export interface IOrderStatusHistory {
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "rto";
  timestamp: Date;
  note?: string;
}

export interface IOrderAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing?: string;
  capturedAt?: string;
}

export interface IOrder {
  ref: string;
  product: IProductSnapshot;
  customer: ICustomer;
  size?: string;
  color: string;
  quantity: number;
  instructions?: string;
  itemTotal: number;
  shipping: number;
  grandTotal: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "rto";
  statusHistory: IOrderStatusHistory[];
  attribution?: IOrderAttribution;
  paymentMode: "COD";
  confirmedDetails: boolean;
  ipHash: string;
  userAgent: string;
}

export interface IOrderDocument extends IOrder, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSnapshotSchema = new Schema<IProductSnapshot>(
  {
    productId: { type: String, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    shippingCharge: { type: Number, required: true },
  },
  { _id: false }
);

const CustomerAddressSchema = new Schema<ICustomerAddress>(
  {
    house: { type: String, required: true },
    street: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pin: { type: String, required: true },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, index: true },
    email: { type: String },
    address: { type: CustomerAddressSchema, required: true },
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "rto"],
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const OrderAttributionSchema = new Schema<IOrderAttribution>(
  {
    utm_source: { type: String },
    utm_medium: { type: String },
    utm_campaign: { type: String },
    utm_content: { type: String },
    utm_term: { type: String },
    landing: { type: String },
    capturedAt: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    ref: { type: String, required: true, unique: true, index: true },
    product: { type: ProductSnapshotSchema, required: true },
    customer: { type: CustomerSchema, required: true },
    size: { type: String },
    color: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 5 },
    instructions: { type: String },
    itemTotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "rto"],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
    attribution: { type: OrderAttributionSchema },
    paymentMode: { type: String, required: true, enum: ["COD"], default: "COD" },
    confirmedDetails: { type: Boolean, required: true, default: true },
    ipHash: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.ipHash;
        return ret;
      },
    },
  }
);

OrderSchema.index({ "customer.mobile": 1, "product.slug": 1, size: 1, createdAt: -1 });

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);
