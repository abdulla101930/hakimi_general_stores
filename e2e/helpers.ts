import { type Page } from '@playwright/test';
import type { Product } from '../src/types';

export const VARIANT_TOMATO: Product = {
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
  availableVariants: [
    { weight: '500 g', price: 35, originalPrice: 50 },
    { weight: '1 kg', price: 65, originalPrice: 80 }
  ]
};

export const MILK: Product = {
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

export function productJson(products: Product[]): string {
  return JSON.stringify(products);
}

export function seedPage(page: Page, products?: Product[]): Promise<void> {
  return page.addInitScript(
    ({ seed, catalogJson }) => {
      window.open = () => null as unknown as Window;
      window.alert = () => undefined;
      if (seed) {
        localStorage.setItem('hakimi_catalog', catalogJson);
      }
    },
    { seed: Boolean(products), catalogJson: productJson(products || []) }
  );
}
