import type { Product, ProductVariant } from '../types';

export const cartKeyOf = (productId: string, weight: string): string => `${productId}::${weight}`;

export const parseCartKey = (key: string): { productId: string; weight?: string } => {
  const idx = key.indexOf('::');
  if (idx === -1) return { productId: key, weight: undefined };
  return { productId: key.slice(0, idx), weight: key.slice(idx + 2) };
};

export const getProductVariant = (product: Product, weight?: string): ProductVariant | undefined =>
  product.availableVariants?.find((v) => v.weight === weight);

export const getProductPrice = (product: Product, weight?: string): number =>
  getProductVariant(product, weight)?.price ?? product.price;

export const getProductOriginalPrice = (product: Product, weight?: string): number | undefined =>
  getProductVariant(product, weight)?.originalPrice ?? product.originalPrice;

export const getProductHandlingFee = (product: Product, weight?: string): number | undefined =>
  getProductVariant(product, weight)?.handlingFee ?? product.handlingFee;

export interface CartLine {
  product: Product;
  weight: string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

export function resolveCartLines(cart: Record<string, number>, catalog: Product[]): CartLine[] {
  const merged = new Map<string, CartLine>();
  Object.entries(cart).forEach(([key, qty]) => {
    if (qty <= 0) return;
    const { productId, weight } = parseCartKey(key);
    const product = catalog.find((p) => p.id === productId);
    if (!product) return;
    const w = weight ?? product.weight;
    const mergedKey = cartKeyOf(product.id, w);
    const existing = merged.get(mergedKey);
    const variant = getProductVariant(product, w);
    if (existing) {
      existing.quantity += qty;
    } else {
      merged.set(mergedKey, {
        product,
        weight: w,
        quantity: qty,
        price: variant?.price ?? product.price,
        originalPrice: variant?.originalPrice ?? product.originalPrice
      });
    }
  });
  return [...merged.values()];
}
