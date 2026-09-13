import { describe, expect, it } from 'vitest';
import { describeLeg, estimateMinutes, formatDistance, formatDuration, haversineKm } from './routeEstimate';

const klcc = { latitude: 3.1579, longitude: 101.7116 };
const batuCaves = { latitude: 3.2379, longitude: 101.684 };

describe('routeEstimate', () => {
  it('measures straight-line distance between two places', () => {
    const km = haversineKm(klcc, batuCaves);
    expect(km).not.toBeNull();
    expect(km as number).toBeGreaterThan(9);
    expect(km as number).toBeLessThan(10.5);
    expect(haversineKm(klcc, { latitude: null, longitude: null })).toBeNull();
  });

  it('estimates slower legs for walking than for trains', () => {
    const walk = estimateMinutes(9.4, 'walk');
    const train = estimateMinutes(9.4, 'train');
    expect(walk).toBeGreaterThan(train as number);
    expect(estimateMinutes(null, 'car')).toBeNull();
    expect(estimateMinutes(0.05, 'walk')).toBe(1);
  });

  it('formats durations and distances for labels', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(95)).toBe('1 h 35 min');
    expect(formatDuration(null)).toBeNull();
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(3.26)).toBe('3.3 km');
    expect(formatDistance(42)).toBe('42 km');
  });

  it('describes a leg end to end', () => {
    const leg = describeLeg(klcc, batuCaves, 'train');
    expect(leg.duration).toMatch(/min/);
    expect(leg.distance).toMatch(/km/);
  });
});
