import type { Address } from '../types';

export interface RegisteredAccount {
  phone: string;
  name: string;
  password?: string;
  addresses: Address[];
}

const CRITICAL_KEYS = [
  'hakimi_user',
  'hakimi_registered_users',
  'hakimi_active_order',
  'hakimi_maintenance_mode',
  'hakimi_catalog',
  'hakimi_orders',
  'hakimi_free_delivery_threshold',
  'hakimi_delivery_mode',
  'hakimi_flat_delivery_charge',
  'hakimi_distance_rate_multiplier'
];

function getStore(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeJSONParse<T>(key: string, fallback: T): T {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return fallback;
    const parsed = JSON.parse(raw);
    return parsed !== undefined && parsed !== null ? parsed : fallback;
  } catch {
    try {
      store.removeItem(key);
    } catch {
      /* noop */
    }
    return fallback;
  }
}

export function safeJSONStringify(key: string, value: unknown): void {
  const store = getStore();
  if (!store) return;
  try {
    if (value === undefined || value === null) {
      store.removeItem(key);
    } else {
      store.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* noop */
  }
}

export function sanitizeAppStorage(): void {
  const store = getStore();
  if (!store) return;
  CRITICAL_KEYS.forEach((key) => {
    try {
      const raw = store.getItem(key);
      if (!raw) return;
      if (raw === 'undefined' || raw === 'null' || raw === '[object Object]') {
        store.removeItem(key);
      } else if (key === 'hakimi_user' || key === 'hakimi_active_order') {
        JSON.parse(raw);
      }
    } catch {
      try {
        store.removeItem(key);
      } catch {
        /* noop */
      }
    }
  });
}

export function resetAppStorageAndReload(): void {
  const store = getStore();
  try {
    store?.clear();
    try {
      sessionStorage.clear();
    } catch {
      /* noop */
    }
  } catch {
    /* noop */
  }

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if (typeof caches !== 'undefined') {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {});
  }
  window.location.reload();
}

export function getRegisteredUsers(): Record<string, RegisteredAccount> {
  return safeJSONParse<Record<string, RegisteredAccount>>('hakimi_registered_users', {});
}

export function saveRegisteredUser(account: RegisteredAccount): void {
  const users = getRegisteredUsers();
  const cleanKey = account.phone.replace(/\D/g, '');
  if (!cleanKey) return;
  users[cleanKey] = {
    ...users[cleanKey],
    ...account,
    phone: account.phone.trim()
  };
  safeJSONStringify('hakimi_registered_users', users);
}

export function findRegisteredUser(phone: string): RegisteredAccount | null {
  const users = getRegisteredUsers();
  const cleanKey = phone.replace(/\D/g, '');
  if (!cleanKey) return null;
  return users[cleanKey] || null;
}

