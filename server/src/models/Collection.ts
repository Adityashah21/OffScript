import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import { type Condition, type MatchRule, type Placement } from "../schemas/collection.schema.js";

export interface ICollection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  match: MatchRule;
  placements: Placement[];
}

export type CollectionDocument = HydratedDocument<ICollection>;

const ConditionSchema = new Schema<Condition>(
  {
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
  },
  { _id: false }
);

const MatchRuleSchema = new Schema<MatchRule>(
  {
    matchAll: { type: Boolean, default: false },
    any: { type: [ConditionSchema], default: [] },
  },
  { _id: false }
);

const PlacementSchema = new Schema<Placement>(
  {
    surface: {
      type: String,
      required: true,
      enum: ["trend", "occasion", "mood"],
    },
    label: { type: String },
    note: { type: String },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const CollectionSchema = new Schema<ICollection>(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    eyebrow: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    match: { type: MatchRuleSchema, required: true },
    placements: { type: [PlacementSchema], default: [] },
  },
  {
    timestamps: true,
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

export const Collection: Model<ICollection> =
  mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema);
