import type { Attraction } from '../data/attractions';

export type RouteStop = {
  attraction: Attraction;
  day: number;
  sequenceIndex: number;
  startHour: number;
};

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 35;
const DAY_START_HOUR = 9;
const MAX_HOURS_PER_DAY = 9;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const haversineDistanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

const orderByNearestNeighbor = (selected: Attraction[]): Attraction[] => {
  if (selected.length === 0) return [];

  const remaining = [...selected];
  const ordered: Attraction[] = [remaining.shift() as Attraction];

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((candidate, index) => {
      const distance = haversineDistanceKm(last, candidate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return ordered;
};

/**
 * Orders selected attractions by proximity, then packs them into days using an
 * assumed average travel speed and a fixed daily activity window (9am + 9h).
 */
export const buildRoute = (selected: Attraction[]): RouteStop[] => {
  const ordered = orderByNearestNeighbor(selected);
  const stops: RouteStop[] = [];

  let day = 1;
  let hourCursor = DAY_START_HOUR;
  let sequenceIndex = 0;
  let previous: Attraction | null = null;

  for (const attraction of ordered) {
    let travelHours = previous ? haversineDistanceKm(previous, attraction) / AVERAGE_SPEED_KMH : 0;
    const projectedEnd = hourCursor + travelHours + attraction.durationHours;

    if (previous && projectedEnd > DAY_START_HOUR + MAX_HOURS_PER_DAY) {
      day += 1;
      hourCursor = DAY_START_HOUR;
      sequenceIndex = 0;
      travelHours = 0;
    } else {
      hourCursor += travelHours;
    }

    stops.push({ attraction, day, sequenceIndex, startHour: hourCursor });
    hourCursor += attraction.durationHours;
    sequenceIndex += 1;
    previous = attraction;
  }

  return stops;
};

export const formatHour = (hour: number) => {
  const wholeHour = Math.floor(hour) % 24;
  const minutes = Math.round((hour - Math.floor(hour)) * 60);
  return `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const totalDays = (stops: RouteStop[]) => (stops.length === 0 ? 0 : Math.max(...stops.map((stop) => stop.day)));

export const totalCost = (stops: RouteStop[]) => stops.reduce((sum, stop) => sum + stop.attraction.estimatedCost, 0);
