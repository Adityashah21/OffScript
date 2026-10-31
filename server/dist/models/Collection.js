import mongoose, { Schema } from "mongoose";
const ConditionSchema = new Schema({
    field: {
        type: String,
        required: true,
        enum: [
            "gender",
            "category",
            "collectionIds",
            "tags",
            "price",
            "isNew",
            "isFeatured",
            "isEditorsPick",
        ],
    },
    op: {
        type: String,
        required: true,
        enum: ["eq", "in", "lt", "containsAny", "isTrue"],
    },
    value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });
const MatchRuleSchema = new Schema({
    matchAll: { type: Boolean, default: false },
    any: { type: [ConditionSchema], default: [] },
}, { _id: false });
const PlacementSchema = new Schema({
    surface: {
        type: String,
        required: true,
        enum: ["trend", "occasion", "mood"],
    },
    label: { type: String },
    note: { type: String },
    order: { type: Number, required: true, default: 0 },
}, { _id: false });
const CollectionSchema = new Schema({
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    eyebrow: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    match: { type: MatchRuleSchema, required: true },
    placements: { type: [PlacementSchema], default: [] },
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
export const Collection = mongoose.models.Collection || mongoose.model("Collection", CollectionSchema);
