import { z } from 'zod';
import type { ProductCategory, ProductGender, PurchaseMode } from '../types/models';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Tops',
  'Shirts',
  'Bottoms',
  'Dresses',
  'Footwear',
  'Accessories',
];

export const PRODUCT_GENDERS: ProductGender[] = ['women', 'men', 'unisex'];
export const PURCHASE_MODES: PurchaseMode[] = ['affiliate', 'authorized_cod'];

export const SIZE_PRESETS = {
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  waist: ['28', '30', '32', '34', '36'],
  footwear: ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
};

export const COLOR_PRESETS = [
  'Black',
  'White',
  'Beige',
  'Navy',
  'Olive',
  'Grey',
  'Brown',
  'Cream',
  'Khaki',
  'Charcoal',
];

/**
 * Convert string to URL-friendly lowercase slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

export const productFormSchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric characters with hyphens only'),
    description: z.string().min(1, 'Description is required'),
    category: z.enum(
      ['Tops', 'Shirts', 'Bottoms', 'Dresses', 'Footwear', 'Accessories'] as const,
      { required_error: 'Please select a category' }
    ),
    subcategory: z.string().min(1, 'Subcategory is required'),
    gender: z.enum(['women', 'men', 'unisex'] as const, {
      required_error: 'Please select a gender',
    }),
    retailer: z.string().min(1, 'Retailer is required'),
    brand: z.string().min(1, 'Brand is required'),
    price: z.coerce.number().int('Price must be an integer').nonnegative('Price must be positive'),
    originalPrice: z.coerce
      .number()
      .int('Original price must be an integer')
      .positive('Original price must be positive')
      .optional()
      .or(z.literal(0).transform(() => undefined))
      .or(z.nan().transform(() => undefined)),
    currency: z.literal('INR').default('INR'),
    images: z.array(z.string()).min(1, 'At least one product image is required'),
    availableSizes: z.array(z.string()).default([]),
    availableColors: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    collectionIds: z.array(z.string()).default([]),
    affiliateUrl: z
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => !val || /^https?:\/\//i.test(val),
        'Must be a valid URL starting with http:// or https://'
      ),
    purchaseMode: z.enum(['affiliate', 'authorized_cod'] as const).default('affiliate'),
    codEnabled: z.boolean().default(false),
    shippingCharge: z.coerce.number().int().nonnegative().default(0),
    inStock: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isEditorsPick: z.boolean().default(false),
    material: z.string().optional(),
    fit: z.string().optional(),
    lastUpdatedAt: z.string().default(() => new Date().toISOString()),
  })
  .refine(
    (data) => data.codEnabled === (data.purchaseMode === 'authorized_cod'),
    {
      message: 'codEnabled must be true if and only if purchaseMode is authorized_cod',
      path: ['codEnabled'],
    }
  )
  .refine(
    (data) => !data.originalPrice || data.originalPrice > data.price,
    {
      message: 'Original price must be strictly greater than current price',
      path: ['originalPrice'],
    }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;
