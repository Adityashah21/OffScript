import mongoose, { Document, Schema, Model } from "mongoose";

export interface IAffiliateClick {
  productId?: string;
  productSlug: string;
  retailer: string;
  destinationUrl?: string;
  ipHash?: string;
  userAgent?: string;
  attribution?: Record<string, string>;
  timestamp: Date;
}

export interface IAffiliateClickDocument extends IAffiliateClick, Document {
  id: string;
}

const AffiliateClickSchema = new Schema<IAffiliateClickDocument>(
  {
    productId: { type: String, index: true },
    productSlug: { type: String, required: true, index: true },
    retailer: { type: String, required: true, index: true },
    destinationUrl: { type: String },
    ipHash: { type: String },
    userAgent: { type: String },
    attribution: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
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

export const AffiliateClick: Model<IAffiliateClickDocument> =
  mongoose.models.AffiliateClick ||
  mongoose.model<IAffiliateClickDocument>("AffiliateClick", AffiliateClickSchema);
