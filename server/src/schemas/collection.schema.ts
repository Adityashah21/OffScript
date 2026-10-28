import { z } from "zod";

export const CONDITION_FIELDS = [
  "gender",
  "category",
  "collectionIds",
  "tags",
  "price",
  "isNew",
  "isFeatured",
  "isEditorsPick",
] as const;

export const CONDITION_OPS = ["eq", "in", "lt", "containsAny", "isTrue"] as const;

export const conditionSchema = z.object({
  field: z.enum(CONDITION_FIELDS),
  op: z.enum(CONDITION_OPS),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const matchRuleSchema = z.object({
  matchAll: z.boolean().optional(),
  any: z.array(conditionSchema).optional(),
});

export const placementSchema = z.object({
  surface: z.enum(["trend", "occasion", "mood"]),
  label: z.string().optional(),
  note: z.string().optional(),
  order: z.number().int().default(0),
});

export const collectionSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  eyebrow: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  match: matchRuleSchema,
  placements: z.array(placementSchema).default([]),
});

export type Condition = z.infer<typeof conditionSchema>;
export type MatchRule = z.infer<typeof matchRuleSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
