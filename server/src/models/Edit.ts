import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export interface IEdit {
  slug: string;
  headline: string[];
  intro: string;
  image: string;
  collection: string;
  related: string[];
}

export type EditDocument = HydratedDocument<IEdit>;

const EditSchema = new Schema<IEdit>(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    headline: { type: [String], required: true },
    intro: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    collection: { type: String, required: true, trim: true, index: true },
    related: { type: [String], default: [] },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
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

export const Edit: Model<IEdit> =
  mongoose.models.Edit || mongoose.model<IEdit>("Edit", EditSchema);
