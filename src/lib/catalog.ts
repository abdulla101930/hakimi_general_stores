import type { Product, ProductVariant } from '../types';

export function normalizeProductName(name: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeWeight(weight: string): string {
  return (weight || '').trim().toLowerCase().replace(/\s+/g, '');
}

export function mergeCatalogByVariant(catalog: Product[]): Product[] {
  const groups = new Map<string, Product[]>();
  catalog.forEach((p) => {
    if (!p || !p.name) return;
    const key = normalizeProductName(p.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const merged: Product[] = [];
  catalog.forEach((p) => {
    if (!p || !p.name) return;
    const key = normalizeProductName(p.name);
    const group = groups.get(key)!;
    if (group[0].id !== p.id) return;

    if (group.length === 1) {
      merged.push(p);
      return;
    }

    const variantMap = new Map<string, ProductVariant>();
    group.forEach((member) => {
      (member.availableVariants || []).forEach((v) => {
        if (v.weight && !variantMap.has(normalizeWeight(v.weight))) variantMap.set(normalizeWeight(v.weight), v);
      });
      if (member.weight) {
        const wKey = normalizeWeight(member.weight);
        if (!variantMap.has(wKey)) {
          variantMap.set(wKey, {
            weight: member.weight,
            price: member.price,
            originalPrice: member.originalPrice,
            handlingFee: member.handlingFee
          });
        }
      }
    });

    const variants = Array.from(variantMap.values());
    merged.push({
      ...p,
      price: variants[0]?.price ?? p.price,
      originalPrice: variants[0]?.originalPrice ?? p.originalPrice,
      weight: variants[0]?.weight ?? p.weight,
      handlingFee: variants[0]?.handlingFee ?? p.handlingFee,
      inStock: group.some((m) => m.inStock),
      availableVariants: variants
    });
  });
  return merged;
}
