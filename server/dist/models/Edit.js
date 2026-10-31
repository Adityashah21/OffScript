import mongoose, { Schema } from "mongoose";
const EditSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    headline: { type: [String], required: true },
    intro: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    collection: { type: String, required: true, trim: true, index: true },
    related: { type: [String], default: [] },
}, {
    timestamps: true,
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
export const Edit = mongoose.models.Edit || mongoose.model("Edit", EditSchema);
