import { z } from "zod";

export const editSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  headline: z.array(z.string()).min(1),
  intro: z.string().min(1),
  image: z.string().min(1),
  collection: z.string().min(1),
  related: z.array(z.string()).default([]),
});

export type EditInput = z.infer<typeof editSchema>;
