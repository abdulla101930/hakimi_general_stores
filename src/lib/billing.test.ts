import { describe, expect, it } from 'vitest';
import type { Address, Coupon, DeliverySettings } from '../types';
import { computeBill, computeCouponSavings, computeDeliveryCharge } from './billing';

const flatSettings: DeliverySettings = {
  freeDeliveryThreshold: 300,
  deliveryPricingMode: 'flat',
  flatDeliveryCharge: 30,
  distanceRateMultiplier: 10
};

const distanceSettings: DeliverySettings = {
  freeDeliveryThreshold: 300,
  deliveryPricingMode: 'distance',
  flatDeliveryCharge: 30,
  distanceRateMultiplier: 10
};

const homeAddress: Address = {
  type: 'Home',
  details: '22, Nehru Nagar, Ratlam (GPS: 23.33227, 75.04944)',
  gps: { lat: 23.33227, lng: 75.04944 }
};

const welcome50: Coupon = { code: 'WELCOME50', description: 'Flat ₹50 Off', discountType: 'flat', value: 50 };
const freeShipping: Coupon = { code: 'FREEGO', description: 'Free handling & delivery', discountType: 'free_shipping', value: 0 };

describe('computeDeliveryCharge', () => {
  it('is free above the threshold', () => {
    expect(computeDeliveryCharge(500, flatSettings, homeAddress)).toBe(0);
    expect(computeDeliveryCharge(300, flatSettings, homeAddress)).toBe(0);
  });

  it('charges the flat rate below the threshold', () => {
    expect(computeDeliveryCharge(200, flatSettings, homeAddress)).toBe(30);
  });

  it('charges distance * rate in distance mode', () => {
    expect(computeDeliveryCharge(200, distanceSettings, homeAddress)).toBeGreaterThanOrEqual(10);
  });

  it('never drops below the minimum distance charge', () => {
    const atStore: Address = { type: 'Home', details: 'Store', gps: { lat: 23.3283, lng: 75.0372 } };
    expect(computeDeliveryCharge(200, distanceSettings, atStore)).toBe(10);
  });
});

describe('computeBill', () => {
  it('computes items, handling, delivery and grand total', () => {
    const bill = computeBill({
      items: [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1, handlingFee: 10 }
      ],
      settings: flatSettings,
      address: homeAddress
    });
    expect(bill.itemsTotal).toBe(250);
    expect(bill.handlingCharge).toBe(10);
    expect(bill.deliveryCharge).toBe(30);
    expect(bill.discount).toBe(0);
    expect(bill.grandTotal).toBe(290);
  });

  it('applies a flat coupon discount', () => {
    const bill = computeBill({
      items: [{ price: 100, quantity: 2 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: welcome50
    });
    expect(bill.discount).toBe(50);
    expect(bill.grandTotal).toBe(200 + 30 - 50);
  });

  it('caps the flat discount at itemsTotal (delivery still applies)', () => {
    const bill = computeBill({
      items: [{ price: 20, quantity: 1 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: welcome50
    });
    expect(bill.discount).toBe(20);
    expect(bill.grandTotal).toBe(30);
  });

  it('free-shipping coupon waives handling and delivery', () => {
    const bill = computeBill({
      items: [{ price: 100, quantity: 1, handlingFee: 15 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: freeShipping
    });
    expect(bill.handlingCharge).toBe(0);
    expect(bill.deliveryCharge).toBe(0);
    expect(bill.grandTotal).toBe(100);
  });

  it('free delivery at/above threshold', () => {
    const bill = computeBill({
      items: [{ price: 320, quantity: 1 }],
      settings: flatSettings,
      address: homeAddress
    });
    expect(bill.deliveryCharge).toBe(0);
    expect(bill.grandTotal).toBe(320);
  });

  it('grand total is never negative', () => {
    const bill = computeBill({
      items: [{ price: 10, quantity: 1 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: welcome50
    });
    expect(bill.grandTotal).toBe(30);
    expect(bill.grandTotal).toBeGreaterThanOrEqual(0);
  });
});

describe('computeCouponSavings', () => {
  it('returns zero when no coupon is applied', () => {
    const savings = computeCouponSavings({
      items: [{ price: 100, quantity: 1 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: null
    });
    expect(savings).toBe(0);
  });

  it('returns the difference the coupon makes', () => {
    const savings = computeCouponSavings({
      items: [{ price: 100, quantity: 2 }],
      settings: flatSettings,
      address: homeAddress,
      coupon: welcome50
    });
    expect(savings).toBe(50);
  });
});
