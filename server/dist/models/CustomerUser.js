import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const CustomerSavedAddressSchema = new Schema({
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
}, { _id: false });
const CustomerUserSchema = new Schema({
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
CustomerUserSchema.methods.comparePassword = async function (candidate) {
    // If passwordHash was not selected in query, retrieve it
    const user = this;
    const hash = user.passwordHash || (await this.constructor.findById(user._id).select("+passwordHash"))?.passwordHash;
    if (!hash)
        return false;
    return bcrypt.compare(candidate, hash);
};
export const CustomerUser = mongoose.models.CustomerUser ||
    mongoose.model("CustomerUser", CustomerUserSchema);
