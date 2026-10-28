import { describe, it, expect } from 'vitest';
import { slugify, productFormSchema } from '../src/lib/products';

describe('Slugify Utility', () => {
  it('converts titles into clean URL-friendly slugs', () => {
    expect(slugify('Oversized Linen Shirt')).toBe('oversized-linen-shirt');
    expect(slugify('Black & White Wool Coat')).toBe('black-and-white-wool-coat');
    expect(slugify('  Vintage Denim 1990!  ')).toBe('vintage-denim-1990');
    expect(slugify('Sneakers --- High Top')).toBe('sneakers-high-top');
  });
});

describe('Product Form Zod Schema & Invariants', () => {
  const baseValidProduct = {
    name: 'Minimalist Relaxed Blazer',
    slug: 'minimalist-relaxed-blazer',
    description: 'An elegant unstructured single-breasted blazer in virgin wool.',
    category: 'Tops' as const,
    subcategory: 'Blazers',
    gender: 'unisex' as const,
    retailer: 'OFFSCRIPT',
    brand: 'OFFSCRIPT Atelier',
    price: 4999,
    originalPrice: 7999,
    currency: 'INR' as const,
    images: ['https://example.com/blazer-1.jpg'],
    availableSizes: ['S', 'M', 'L'],
    availableColors: ['Charcoal', 'Navy'],
    tags: ['tailoring', 'autumn'],
    collectionIds: ['minimalist-wardrobe'],
    affiliateUrl: null,
    purchaseMode: 'affiliate' as const,
    codEnabled: false,
    shippingCharge: 0,
    inStock: true,
    isFeatured: false,
    isNew: true,
    isEditorsPick: true,
    material: '100% Wool',
    fit: 'Relaxed',
    lastUpdatedAt: new Date().toISOString(),
  };

  it('accepts valid product with matching affiliate invariants', () => {
    const result = productFormSchema.safeParse(baseValidProduct);
    expect(result.success).toBe(true);
  });

  it('accepts valid product with authorized COD invariants', () => {
    const codProduct = {
      ...baseValidProduct,
      purchaseMode: 'authorized_cod' as const,
      codEnabled: true,
      shippingCharge: 150,
    };
    const result = productFormSchema.safeParse(codProduct);
    expect(result.success).toBe(true);
  });

  it('rejects when codEnabled disagrees with purchaseMode (COD=true with affiliate)', () => {
    const invalidProduct = {
      ...baseValidProduct,
      purchaseMode: 'affiliate' as const,
      codEnabled: true, // Mismatch!
    };
    const result = productFormSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('codEnabled'))).toBe(true);
    }
  });

  it('rejects when codEnabled disagrees with purchaseMode (COD=false with authorized_cod)', () => {
    const invalidProduct = {
      ...baseValidProduct,
      purchaseMode: 'authorized_cod' as const,
      codEnabled: false, // Mismatch!
    };
    const result = productFormSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('codEnabled'))).toBe(true);
    }
  });

  it('rejects when originalPrice is less than or equal to selling price', () => {
    const invalidProduct = {
      ...baseValidProduct,
      price: 5000,
      originalPrice: 4000, // Less than price!
    };
    const result = productFormSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('originalPrice'))).toBe(true);
    }
  });

  it('rejects when images array is empty', () => {
    const invalidProduct = {
      ...baseValidProduct,
      images: [],
    };
    const result = productFormSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('images'))).toBe(true);
    }
  });

  it('rejects invalid slug format with spaces or uppercase', () => {
    const invalidProduct = {
      ...baseValidProduct,
      slug: 'Invalid Slug!',
    };
    const result = productFormSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((i) => i.path.includes('slug'))).toBe(true);
    }
  });
});
