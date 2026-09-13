import type { TransportMode } from '../types/database';
import { getTransportOption } from './transport';

export type LatLng = { latitude: number | null; longitude: number | null };

const earthRadiusKm = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in km, or null when either point has no coordinates. */
export const haversineKm = (from: LatLng, to: LatLng) => {
  if (from.latitude === null || from.longitude === null || to.latitude === null || to.longitude === null) return null;

  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

/** Rough minutes for a leg: straight-line distance padded 25% for real roads, plus a boarding buffer. */
export const estimateMinutes = (distanceKm: number | null, mode: TransportMode) => {
  if (distanceKm === null) return null;

  const option = getTransportOption(mode);
  const buffer = mode === 'walk' ? 0 : mode === 'car' ? 5 : 10;
  return Math.max(1, Math.round(((distanceKm * 1.25) / option.speedKmh) * 60 + buffer));
};

export const formatDuration = (minutes: number | null) => {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export const formatDistance = (distanceKm: number | null) => {
  if (distanceKm === null) return null;
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
};

export const describeLeg = (from: LatLng, to: LatLng, mode: TransportMode) => {
  const distanceKm = haversineKm(from, to);
  const minutes = estimateMinutes(distanceKm, mode);
  return { distanceKm, minutes, distance: formatDistance(distanceKm), duration: formatDuration(minutes) };
};
