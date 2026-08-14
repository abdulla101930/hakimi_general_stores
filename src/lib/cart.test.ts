import { describe, expect, it } from 'vitest';
import type { Product } from '../types';
import {
  cartKeyOf,
  parseCartKey,
  getProductVariant,
  getProductPrice,
  getProductOriginalPrice,
  getProductHandlingFee,
  resolveCartLines
} from './cart';

const tomato: Product = {
  id: 'prod-1',
  name: 'Fresh Farm Tomatoes',
  price: 35,
  originalPrice: 50,
  weight: '500 g',
  mainCategory: 'Food',
  subCategory: 'veg/fruits',
  dietaryType: 'veg',
  inStock: true,
  image: '🍅',
  handlingFee: 5,
  availableVariants: [
    { weight: '500 g', price: 35, originalPrice: 50 },
    { weight: '1 kg', price: 65, originalPrice: 80, handlingFee: 10 }
  ]
};

const milk: Product = {
  id: 'prod-9',
  name: 'Amul Taaza Milk',
  price: 27,
  weight: '500 ml',
  mainCategory: 'Food',
  subCategory: 'dairy/bread/eggs',
  dietaryType: 'veg',
  inStock: true,
  image: '🥛'
};

const catalog: Product[] = [tomato, milk];

describe('cartKeyOf / parseCartKey', () => {
  it('encodes productId and weight', () => {
    expect(cartKeyOf('prod-1', '1 kg')).toBe('prod-1::1 kg');
  });

  it('parses a key with weight', () => {
    expect(parseCartKey('prod-1::1 kg')).toEqual({ productId: 'prod-1', weight: '1 kg' });
  });

  it('parses a legacy key without weight', () => {
    expect(parseCartKey('prod-1')).toEqual({ productId: 'prod-1', weight: undefined });
  });

  it('keeps weights containing double colons intact', () => {
    expect(parseCartKey('prod-1::a::b')).toEqual({ productId: 'prod-1', weight: 'a::b' });
  });
});

describe('getProductVariant / getProductPrice', () => {
  it('finds the matching variant', () => {
    expect(getProductVariant(tomato, '1 kg')).toEqual({ weight: '1 kg', price: 65, originalPrice: 80, handlingFee: 10 });
  });

  it('returns undefined for a missing variant', () => {
    expect(getProductVariant(tomato, '2 kg')).toBeUndefined();
    expect(getProductVariant(milk, '1 kg')).toBeUndefined();
  });

  it('uses the variant price when a weight is given', () => {
    expect(getProductPrice(tomato, '1 kg')).toBe(65);
  });

  it('falls back to the base price', () => {
    expect(getProductPrice(tomato, '2 kg')).toBe(35);
    expect(getProductPrice(milk, '500 ml')).toBe(27);
  });

  it('resolves original price from the variant or the product', () => {
    expect(getProductOriginalPrice(tomato, '1 kg')).toBe(80);
    expect(getProductOriginalPrice(tomato, '500 g')).toBe(50);
    expect(getProductOriginalPrice(milk, '500 ml')).toBeUndefined();
  });

  it('resolves handling fee from the variant or the product', () => {
    expect(getProductHandlingFee(tomato, '1 kg')).toBe(10);
    expect(getProductHandlingFee(tomato, '500 g')).toBe(5);
    expect(getProductHandlingFee(milk, '500 ml')).toBeUndefined();
  });
});

describe('resolveCartLines', () => {
  it('builds lines with the correct variant weight and price', () => {
    const lines = resolveCartLines({ [cartKeyOf('prod-1', '1 kg')]: 2 }, catalog);
    expect(lines).toHaveLength(1);
    expect(lines[0].product.id).toBe('prod-1');
    expect(lines[0].weight).toBe('1 kg');
    expect(lines[0].price).toBe(65);
    expect(lines[0].quantity).toBe(2);
  });

  it('defaults to the product weight for legacy keys', () => {
    const lines = resolveCartLines({ 'prod-1': 1 }, catalog);
    expect(lines[0].weight).toBe('500 g');
    expect(lines[0].price).toBe(35);
  });

  it('merges legacy and new keys for the same product + weight', () => {
    const lines = resolveCartLines({ 'prod-1': 1, [cartKeyOf('prod-1', '500 g')]: 2 }, catalog);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
    expect(lines[0].weight).toBe('500 g');
  });

  it('keeps different weights as separate lines', () => {
    const lines = resolveCartLines({ [cartKeyOf('prod-1', '500 g')]: 1, [cartKeyOf('prod-1', '1 kg')]: 1 }, catalog);
    expect(lines).toHaveLength(2);
  });

  it('skips zero and negative quantities', () => {
    const lines = resolveCartLines({ [cartKeyOf('prod-1', '500 g')]: 0, [cartKeyOf('prod-9', '500 ml')]: -2 }, catalog);
    expect(lines).toHaveLength(0);
  });

  it('skips products that no longer exist in the catalog', () => {
    const lines = resolveCartLines({ [cartKeyOf('prod-999', '1 kg')]: 3 }, catalog);
    expect(lines).toHaveLength(0);
  });

  it('resolves multiple products', () => {
    const lines = resolveCartLines(
      { [cartKeyOf('prod-1', '500 g')]: 2, [cartKeyOf('prod-9', '500 ml')]: 1 },
      catalog
    );
    expect(lines).toHaveLength(2);
    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    expect(total).toBe(35 * 2 + 27);
  });
});
