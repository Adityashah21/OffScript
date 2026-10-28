import mongoose, { Document, Schema, Model } from "mongoose";
import crypto from "crypto";

export interface INewsletterSubscriber {
  email: string;
  source: string;
  unsubscribed: boolean;
  unsubscribeToken: string;
}

export interface INewsletterSubscriberDocument extends INewsletterSubscriber, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriberDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    source: { type: String, default: "footer" },
    unsubscribed: { type: Boolean, default: false, index: true },
    unsubscribeToken: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(24).toString("hex"),
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.unsubscribeToken;
        return ret;
      },
    },
  }
);

export const NewsletterSubscriber: Model<INewsletterSubscriberDocument> =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriberDocument>(
    "NewsletterSubscriber",
    NewsletterSubscriberSchema
  );
