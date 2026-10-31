import mongoose, { Schema } from "mongoose";
const AdminUserSchema = new Schema({
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
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash;
            return ret;
        },
    },
});
export const AdminUser = mongoose.models.AdminUser ||
    mongoose.model("AdminUser", AdminUserSchema);
