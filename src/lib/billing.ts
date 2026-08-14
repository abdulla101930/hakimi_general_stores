import type { Address, Coupon, DeliverySettings } from '../types';
import { distanceFromStore } from './geo';

export function computeDeliveryCharge(
  itemsTotal: number,
  settings: DeliverySettings,
  address?: Address | null
): number {
  if (itemsTotal >= settings.freeDeliveryThreshold) return 0;

  if (settings.deliveryPricingMode === 'distance') {
    const distanceKm = Math.max(1, Math.round(distanceFromStore(address?.gps, address?.details) * 10) / 10);
    return Math.max(10, Math.round(distanceKm * settings.distanceRateMultiplier));
  }

  return settings.flatDeliveryCharge;
}

export interface BillItemInput {
  price: number;
  quantity: number;
  handlingFee?: number;
}

export interface BillInput {
  items: BillItemInput[];
  settings: DeliverySettings;
  address?: Address | null;
  coupon?: Coupon | null;
}

export interface BillResult {
  itemsTotal: number;
  handlingCharge: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
}

export function computeBill(input: BillInput): BillResult {
  const { items, settings, address, coupon } = input;

  let itemsTotal = 0;
  let handlingCharge = 0;
  items.forEach((item) => {
    itemsTotal += item.price * item.quantity;
    handlingCharge += (item.handlingFee || 0) * item.quantity;
  });

  let deliveryCharge = computeDeliveryCharge(itemsTotal, settings, address);
  let discount = 0;

  if (coupon) {
    if (coupon.discountType === 'flat') {
      discount = Math.min(coupon.value, itemsTotal);
    } else {
      handlingCharge = 0;
      deliveryCharge = 0;
    }
  }

  const grandTotal = Math.max(0, itemsTotal + handlingCharge + deliveryCharge - discount);
  return { itemsTotal, handlingCharge, deliveryCharge, discount, grandTotal };
}

export function computeCouponSavings(
  input: BillInput & { coupon: Coupon | null }
): number {
  const base = computeBill({ ...input, coupon: null });
  if (!input.coupon) return 0;
  const withCoupon = computeBill({ ...input, coupon: input.coupon });
  return base.grandTotal - withCoupon.grandTotal;
}
