import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import { mergeCatalogByVariant, normalizeProductName } from './catalog';

const chawla250: Product = {
  id: 'prod-a',
  name: 'Chawla  ',
  price: 30,
  weight: '250 gm',
  mainCategory: 'Food',
  subCategory: 'snacks',
  dietaryType: 'veg',
  inStock: true,
  image: '🥠'
};

const chawla500: Product = {
  id: 'prod-b',
  name: 'Chawla',
  price: 65,
  weight: '500gm',
  mainCategory: 'Food',
  subCategory: 'snacks',
  dietaryType: 'veg',
  inStock: true,
  image: '🥠'
};

const chawla1kg: Product = {
  id: 'prod-c',
  name: 'chawla',
  price: 130,
  weight: '1 kg',
  mainCategory: 'Food',
  subCategory: 'snacks',
  dietaryType: 'veg',
  inStock: false,
  image: '🥠'
};

const comfort860a: Product = {
  id: 'prod-d',
  name: 'Comfort',
  price: 225,
  weight: '860 ml',
  mainCategory: 'Hygiene',
  subCategory: 'cleaning',
  dietaryType: 'none',
  inStock: true,
  image: '🧴'
};

const comfort860b: Product = {
  id: 'prod-e',
  name: 'Comfort',
  price: 235,
  weight: '860ml',
  mainCategory: 'Hygiene',
  subCategory: 'cleaning',
  dietaryType: 'none',
  inStock: true,
  image: '🧴'
};

describe('normalizeProductName', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeProductName('  Chawla  ')).toBe('chawla');
    expect(normalizeProductName('Britania Good Day Butter')).toBe('britania good day butter');
  });
});

describe('mergeCatalogByVariant', () => {
  it('keeps unique products untouched', () => {
    const result = mergeCatalogByVariant([chawla250, comfort860a]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('prod-a');
  });

  it('merges same-name SKUs into one card with all weights', () => {
    const result = mergeCatalogByVariant([chawla250, chawla500, chawla1kg]);
    expect(result).toHaveLength(1);
    const merged = result[0];
    expect(merged.id).toBe('prod-a');
    expect(merged.availableVariants).toHaveLength(3);
    const weights = merged.availableVariants!.map((v) => v.weight);
    expect(weights).toEqual(['250 gm', '500gm', '1 kg']);
    expect(merged.price).toBe(30);
    expect(merged.inStock).toBe(true);
  });

  it('collapses weight spellings that only differ in whitespace', () => {
    const result = mergeCatalogByVariant([comfort860a, comfort860b]);
    expect(result).toHaveLength(1);
    expect(result[0].availableVariants).toHaveLength(1);
    expect(result[0].availableVariants![0].weight).toBe('860 ml');
  });

  it('preserves existing availableVariants across SKUs', () => {
    const withVariants: Product = {
      ...chawla250,
      availableVariants: [{ weight: '250 gm', price: 30 }, { weight: '500 gm', price: 60 }]
    };
    const result = mergeCatalogByVariant([withVariants, chawla500]);
    expect(result).toHaveLength(1);
    expect(result[0].availableVariants).toHaveLength(2);
    expect(result[0].availableVariants!.map((v) => v.weight)).toEqual(['250 gm', '500 gm']);
  });

  it('keeps the original catalog order for first occurrences', () => {
    const result = mergeCatalogByVariant([chawla1kg, comfort860a, chawla250]);
    expect(result.map((p) => p.id)).toEqual(['prod-c', 'prod-d']);
  });
});
