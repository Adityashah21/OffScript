import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAdminUser {
  email: string;
  passwordHash: string;
  role: string;
}

export interface IAdminUserDocument extends IAdminUser, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: "admin" },
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

export const AdminUser: Model<IAdminUserDocument> =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUserDocument>("AdminUser", AdminUserSchema);
