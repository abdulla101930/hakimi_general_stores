import { describe, expect, it } from 'vitest';
import {
  STORE_LOCATION,
  calculateDistanceKm,
  distanceFromStore,
  parseGpsFromAddressDetails
} from './geo';

describe('calculateDistanceKm', () => {
  it('is zero between identical coordinates', () => {
    expect(calculateDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, STORE_LOCATION.lat, STORE_LOCATION.lng)).toBe(0);
  });

  it('is symmetric', () => {
    const a = calculateDistanceKm(23.3, 75.0, 23.4, 75.1);
    const b = calculateDistanceKm(23.4, 75.1, 23.3, 75.0);
    expect(a).toBeCloseTo(b, 10);
  });

  it('returns a plausible distance between two cities', () => {
    const km = calculateDistanceKm(23.3283, 75.0372, 23.0225, 72.5714);
    expect(km).toBeGreaterThan(200);
    expect(km).toBeLessThan(260);
  });
});

describe('parseGpsFromAddressDetails', () => {
  it('parses GPS coordinates embedded in an address', () => {
    const parsed = parseGpsFromAddressDetails('Pinned Location near GPS (23.3323, 75.0494) (GPS: 23.3323, 75.0494)');
    expect(parsed).toEqual({ lat: 23.3323, lng: 75.0494 });
  });

  it('returns null when no GPS is present', () => {
    expect(parseGpsFromAddressDetails('22, Nehru Nagar, Ratlam')).toBeNull();
    expect(parseGpsFromAddressDetails('')).toBeNull();
  });
});

describe('distanceFromStore', () => {
  it('uses the provided GPS', () => {
    const km = distanceFromStore({ lat: 23.33227, lng: 75.04944 });
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(5);
  });

  it('falls back to the default user location when GPS is missing', () => {
    expect(distanceFromStore(null, undefined)).toBeGreaterThan(0);
  });

  it('parses GPS from the address details when gps is absent', () => {
    const km = distanceFromStore(null, 'Home near GPS: 23.3323, 75.0494');
    expect(km).toBeGreaterThan(0);
  });
});
