import { z } from "zod";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "rto",
] as const;

export const createOrderSchema = z.object({
  productSlug: z.string().min(1, "Product slug is required"),
  fullName: z.string().trim().min(2, "Enter your full name."),
  mobile: z
    .string()
    .trim()
    .refine(
      (v) => /^(?:\+91[\s-]?|0)?[6-9]\d{9}$/.test(v.replace(/\s+/g, "")),
      "Enter a valid 10-digit Indian mobile number."
    ),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Enter a valid email or leave it blank."
    ),
  house: z.string().trim().min(1, "Enter your house or flat number."),
  street: z.string().trim().min(1, "Enter your street or locality."),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(1, "Enter your city."),
  state: z.string().trim().refine(
    (v) => INDIAN_STATES.includes(v as (typeof INDIAN_STATES)[number]),
    "Select a valid state."
  ),
  pin: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
  size: z.string().trim().optional(),
  color: z.string().trim().min(1, "Select a colour."),
  quantity: z
    .number()
    .int("Quantity must be an integer.")
    .min(1, "Quantity must be between 1 and 5.")
    .max(5, "Quantity must be between 1 and 5."),
  instructions: z.string().trim().optional(),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Please confirm your details." }),
  }),
  attribution: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_content: z.string().optional(),
      utm_term: z.string().optional(),
      landing: z.string().optional(),
      capturedAt: z.string().optional(),
    })
    .optional(),
  // Honeypot field for bot protection (must be empty)
  _hp: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
