export interface ProductVariant {
  weight: string;
  price: number;
  originalPrice?: number;
  handlingFee?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  weight: string;
  mainCategory: 'Food' | 'Hygiene';
  subCategory: string;
  category?: string;
  dietaryType?: 'veg' | 'non-veg' | 'none';
  inStock: boolean;
  image: string;
  handlingFee?: number;
  availableVariants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  weight: string;
}

export interface Address {
  type: string;
  details: string;
  gps?: { lat: number; lng: number };
  distanceKm?: number;
}

export interface BillDetails {
  itemsTotal: number;
  handlingCharge: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
}

export interface OrderTimelog {
  placedAt?: string;
  packingAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  customerPhone: string;
  customerName: string;
  items: OrderItem[];
  address: Address;
  bill: BillDetails;
  status: 'placed' | 'packing' | 'out_for_delivery' | 'delivered';
  date: string;
  timelog?: OrderTimelog;
  instructions?: string;
  driverPosition?: { x: number; y: number };
  eta?: number;
  paymentMethod?: 'COD' | 'ONLINE';
  paymentStatus?: 'Pending' | 'Paid (Online)';
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'flat' | 'free_shipping';
  value: number;
}

export interface User {
  phone: string;
  name: string;
  addresses: Address[];
}

export type Role = 'customer' | 'owner';
export type View = 'catalog' | 'cart' | 'tracking' | 'admin';
export type DeliveryPricingMode = 'flat' | 'distance';
export type OrderStatus = Order['status'];

export interface DeliverySettings {
  freeDeliveryThreshold: number;
  deliveryPricingMode: DeliveryPricingMode;
  flatDeliveryCharge: number;
  distanceRateMultiplier: number;
}
