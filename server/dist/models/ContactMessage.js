import mongoose, { Schema } from "mongoose";
const ContactMessageSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
        type: String,
        required: true,
        enum: ["new", "read", "replied"],
        default: "new",
        index: true,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
export const ContactMessage = mongoose.models.ContactMessage ||
    mongoose.model("ContactMessage", ContactMessageSchema);
