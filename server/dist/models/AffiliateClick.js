import mongoose, { Schema } from "mongoose";
const AffiliateClickSchema = new Schema({
    productId: { type: String, index: true },
    productSlug: { type: String, required: true, index: true },
    retailer: { type: String, required: true, index: true },
    destinationUrl: { type: String },
    ipHash: { type: String },
    userAgent: { type: String },
    attribution: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
}, {
    timestamps: false,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
export const AffiliateClick = mongoose.models.AffiliateClick ||
    mongoose.model("AffiliateClick", AffiliateClickSchema);
