import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICustomerSavedAddress {
  id: string;
  tag?: string;
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pin: string;
  isDefault?: boolean;
}

export interface ICustomerUser {
  name: string;
  email: string;
  passwordHash: string;
  mobile?: string;
  addresses: ICustomerSavedAddress[];
  wishlist: string[];
  recentlyViewed: string[];
  role: "customer";
}

export interface ICustomerUserDocument extends ICustomerUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const CustomerSavedAddressSchema = new Schema<ICustomerSavedAddress>(
  {
    id: { type: String, required: true },
    tag: { type: String, default: "Home" },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    house: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pin: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const CustomerUserSchema = new Schema<ICustomerUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    mobile: { type: String, trim: true, index: true },
    addresses: { type: [CustomerSavedAddressSchema], default: [] },
    wishlist: { type: [String], default: [] },
    recentlyViewed: { type: [String], default: [] },
    role: { type: String, required: true, default: "customer", immutable: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

CustomerUserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  // If passwordHash was not selected in query, retrieve it
  const user = this as ICustomerUserDocument;
  const hash = user.passwordHash || (await (this.constructor as Model<ICustomerUserDocument>).findById(user._id).select("+passwordHash"))?.passwordHash;
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
};

export const CustomerUser: Model<ICustomerUserDocument> =
  mongoose.models.CustomerUser ||
  mongoose.model<ICustomerUserDocument>("CustomerUser", CustomerUserSchema);
