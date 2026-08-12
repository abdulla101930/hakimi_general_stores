/**
 * Safe Storage Utilities for Hakimi Supermarket App
 * Prevents unhandled JSON parsing errors and corrupted state crashes on mobile devices.
 */

export function safeJSONParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed !== undefined && parsed !== null ? parsed : fallback;
  } catch (err) {
    console.warn(`[SafeStorage] Corrupted localStorage key "${key}" detected. Purging key.`, err);
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    return fallback;
  }
}

export function safeJSONStringify(key: string, value: any): void {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`[SafeStorage] Failed to write to localStorage for key "${key}":`, err);
  }
}

export function sanitizeAppStorage(): void {
  const criticalKeys = [
    'hakimi_user',
    'hakimi_active_order',
    'hakimi_maintenance_mode',
    'hakimi_catalog',
    'hakimi_orders',
    'hakimi_free_delivery_threshold',
    'hakimi_delivery_mode',
    'hakimi_flat_delivery_charge',
    'hakimi_distance_rate_multiplier'
  ];

  criticalKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        if (raw === 'undefined' || raw === 'null' || raw === '[object Object]') {
          localStorage.removeItem(key);
        } else if (key === 'hakimi_user' || key === 'hakimi_active_order') {
          JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn(`[SafeStorage] Purged malformed key "${key}" during boot sanitization.`);
      try {
        localStorage.removeItem(key);
      } catch (err) {}
    }
  });
}

export function resetAppStorageAndReload(): void {
  try {
    // Clear localStorage & sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Unregister all Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
    }

    // Clear caches
    if ('caches' in window) {
      caches.keys().then(keys => {
        return Promise.all(keys.map(key => caches.delete(key)));
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Error during app reset:', e);
  }

  // Force page reload
  window.location.reload();
}
