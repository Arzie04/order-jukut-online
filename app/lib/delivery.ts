export type OrderType = 'pickup' | 'delivery';

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  mapsLink: string;
}

export interface DeliveryPricingInput {
  distanceKm: number;
  packageCount: number;
}

export interface DeliveryPricing {
  distanceKm: number;
  baseFee: number;
  packageSurcharge: number;
  deliveryFee: number;
}

export interface OrderLikeItem {
  code: string;
  qty: number;
}

export const DELIVERY_ORIGIN = {
  latitude: -7.053727,
  longitude: 110.396489,
};

export const PICKUP_MINIMUM_ORDER = 10000;
export const DELIVERY_MINIMUM_ORDER = 12000;

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function buildGoogleMapsLink(latitude: number, longitude: number) {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

export function calculateDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function calculateBaseDeliveryFee(distanceKm: number) {
  if (distanceKm < 1) {
    return 3000;
  }

  if (distanceKm <= 3) {
    return 6000;
  }

  return 6000 + Math.ceil(distanceKm - 3) * 1000;
}

export function countPackageItems(orderItems: OrderLikeItem[]) {
  return orderItems.reduce((total, item) => {
    return item.code.trim().startsWith('PKT ') ? total + item.qty : total;
  }, 0);
}

export function calculatePackageSurcharge(packageCount: number) {
  if (packageCount <= 9) {
    return 0;
  }

  // This follows the package-count examples provided in the request.
  const pairCharge = Math.floor((packageCount - 8) / 2) * 1000;
  const oddAdjustment = packageCount >= 11 && packageCount % 2 === 1 ? 1000 : 0;
  return pairCharge + oddAdjustment;
}

export function getDeliveryPricing({
  distanceKm,
  packageCount,
}: DeliveryPricingInput): DeliveryPricing {
  const baseFee = calculateBaseDeliveryFee(distanceKm);
  const packageSurcharge = calculatePackageSurcharge(packageCount);

  return {
    distanceKm,
    baseFee,
    packageSurcharge,
    deliveryFee: baseFee + packageSurcharge,
  };
}

export function getMinimumOrderAmount(orderType: OrderType) {
  return orderType === 'delivery' ? DELIVERY_MINIMUM_ORDER : PICKUP_MINIMUM_ORDER;
}

export function formatDistanceKm(distanceKm: number) {
  return Number(distanceKm.toFixed(2)).toLocaleString('id-ID');
}
