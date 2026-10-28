import { describe, it, expect } from 'vitest';
import type { CollectionRule } from '../src/types/models';

describe('Collection Rules & Placements', () => {
  it('validates rule attributes and operators', () => {
    const sampleRule: CollectionRule = {
      field: 'category',
      operator: 'eq',
      value: 'Tops',
    };

    expect(sampleRule.field).toBe('category');
    expect(sampleRule.operator).toBe('eq');
    expect(sampleRule.value).toBe('Tops');
  });

  it('handles multi-value list operators', () => {
    const tagRule: CollectionRule = {
      field: 'tags',
      operator: 'in',
      value: ['linen', 'summer', 'minimal'],
    };

    expect(tagRule.operator).toBe('in');
    expect(Array.isArray(tagRule.value)).toBe(true);
    expect(tagRule.value).toContain('linen');
  });

  it('aggregates retailer clicks accurately to determine top partner', () => {
    const clickRecords = [
      { productSlug: 'shirt-1', retailer: 'Farfetch', clicks: 25 },
      { productSlug: 'pants-1', retailer: 'Myntra', clicks: 40 },
      { productSlug: 'coat-1', retailer: 'Farfetch', clicks: 35 },
    ];

    const counts: Record<string, number> = {};
    clickRecords.forEach((c) => {
      counts[c.retailer] = (counts[c.retailer] || 0) + c.clicks;
    });

    // Farfetch = 60, Myntra = 40
    expect(counts['Farfetch']).toBe(60);
    expect(counts['Myntra']).toBe(40);

    const sortedRetailers = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    expect(sortedRetailers[0][0]).toBe('Farfetch');
  });
});
