import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
const NewsletterSubscriberSchema = new Schema({
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            delete ret.unsubscribeToken;
            return ret;
        },
    },
});
export const NewsletterSubscriber = mongoose.models.NewsletterSubscriber ||
    mongoose.model("NewsletterSubscriber", NewsletterSubscriberSchema);
