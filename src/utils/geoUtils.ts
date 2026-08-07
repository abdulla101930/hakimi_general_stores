export const STORE_LOCATION = {
  name: "Hakimi General Store",
  address: "Chandni Chowk, Bharava Kui, Bohra Baakhal, Ratlam, Madhya Pradesh 457001",
  lat: 23.3283,
  lng: 75.0372
};

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGpsFromAddressDetails(details?: string): { lat: number; lng: number } | null {
  if (!details) return null;
  const match = details.match(/GPS:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)/i);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
}

export function calculateDeliveryMetrics(selectedAddressGps?: { lat: number; lng: number } | null, addressDetails?: string) {
  let userGps = selectedAddressGps || parseGpsFromAddressDetails(addressDetails);
  
  if (!userGps) {
    // Default location in Ratlam: Shirien Manzil near HDFC Bank (23.33227, 75.04944)
    userGps = { lat: 23.33227, lng: 75.04944 };
  }

  const distanceKm = calculateDistanceKm(STORE_LOCATION.lat, STORE_LOCATION.lng, userGps.lat, userGps.lng);
  const distanceText = distanceKm < 0.1 ? '0.1 km away' : `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km away`;
  const estMins = Math.max(6, Math.ceil(5 + distanceKm * 3.5));
  const timeText = `${estMins} minutes`;

  return {
    distanceKm,
    distanceText,
    estMins,
    timeText
  };
}
