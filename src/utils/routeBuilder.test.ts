import { describe, expect, it } from 'vitest';
import type { Attraction } from '../data/attractions';
import { buildRoute, haversineDistanceKm, totalCost, totalDays } from './routeBuilder';

const makeAttraction = (overrides: Partial<Attraction> & Pick<Attraction, 'id' | 'latitude' | 'longitude'>): Attraction => ({
  state: 'penang',
  name: overrides.id,
  category: 'heritage',
  description: '',
  rating: 4.5,
  popularity: 50,
  estimatedCost: 10,
  durationHours: 1,
  emoji: '📍',
  ...overrides,
});

describe('haversineDistanceKm', () => {
  it('returns 0 for the same point', () => {
    const point = { latitude: 5.4164, longitude: 100.3327 };
    expect(haversineDistanceKm(point, point)).toBe(0);
  });

  it('roughly matches the known ~111km per degree of latitude', () => {
    const a = { latitude: 0, longitude: 0 };
    const b = { latitude: 1, longitude: 0 };
    expect(haversineDistanceKm(a, b)).toBeGreaterThan(110);
    expect(haversineDistanceKm(a, b)).toBeLessThan(112);
  });
});

describe('buildRoute', () => {
  it('returns an empty route for no selections', () => {
    expect(buildRoute([])).toEqual([]);
  });

  it('places a single attraction on day 1 at the start hour', () => {
    const a = makeAttraction({ id: 'a', latitude: 5.41, longitude: 100.33 });
    const [stop] = buildRoute([a]);
    expect(stop.day).toBe(1);
    expect(stop.sequenceIndex).toBe(0);
    expect(stop.startHour).toBe(9);
  });

  it('visits the nearer candidate before the farther one', () => {
    const start = makeAttraction({ id: 'start', latitude: 5.4, longitude: 100.3 });
    const near = makeAttraction({ id: 'near', latitude: 5.401, longitude: 100.301 });
    const far = makeAttraction({ id: 'far', latitude: 5.6, longitude: 100.5 });

    const route = buildRoute([start, far, near]);
    const order = route.map((stop) => stop.attraction.id);

    expect(order.indexOf('near')).toBeLessThan(order.indexOf('far'));
  });

  it('keeps same-day stops that fit within the daily hour budget', () => {
    const stops = [
      makeAttraction({ id: 'a', latitude: 5.41, longitude: 100.33, durationHours: 2 }),
      makeAttraction({ id: 'b', latitude: 5.411, longitude: 100.331, durationHours: 2 }),
      makeAttraction({ id: 'c', latitude: 5.412, longitude: 100.332, durationHours: 2 }),
    ];

    const route = buildRoute(stops);
    expect(totalDays(route)).toBe(1);
  });

  it('spills onto a new day once the daily hour budget is exceeded', () => {
    const stops = [
      makeAttraction({ id: 'a', latitude: 5.41, longitude: 100.33, durationHours: 5 }),
      makeAttraction({ id: 'b', latitude: 5.411, longitude: 100.331, durationHours: 5 }),
    ];

    const route = buildRoute(stops);
    expect(totalDays(route)).toBe(2);
  });

  it('resets sequence index for each new day', () => {
    const stops = [
      makeAttraction({ id: 'a', latitude: 5.41, longitude: 100.33, durationHours: 5 }),
      makeAttraction({ id: 'b', latitude: 5.411, longitude: 100.331, durationHours: 5 }),
    ];

    const route = buildRoute(stops);
    const dayTwoStop = route.find((stop) => stop.day === 2);
    expect(dayTwoStop?.sequenceIndex).toBe(0);
  });
});

describe('totalCost', () => {
  it('sums the estimated cost of every stop', () => {
    const stops = buildRoute([
      makeAttraction({ id: 'a', latitude: 5.41, longitude: 100.33, estimatedCost: 20 }),
      makeAttraction({ id: 'b', latitude: 5.42, longitude: 100.34, estimatedCost: 30 }),
    ]);

    expect(totalCost(stops)).toBe(50);
  });
});
