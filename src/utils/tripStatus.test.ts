import { describe, expect, it } from 'vitest';
import { formatTripDate, getTripStatus } from './tripStatus';

describe('trip status utilities', () => {
  const today = new Date('2026-09-11T12:00:00');

  it('marks ended trips as past', () => {
    expect(getTripStatus('2026-01-01', '2026-01-05', today)).toBe('past');
  });

  it('marks trips that include today as active', () => {
    expect(getTripStatus('2026-09-10', '2026-09-12', today)).toBe('active');
    expect(getTripStatus('2026-09-11', '2026-09-11', today)).toBe('active');
  });

  it('marks future trips as upcoming', () => {
    expect(getTripStatus('2026-10-01', '2026-10-05', today)).toBe('upcoming');
  });

  it('formats ISO date strings for display', () => {
    expect(formatTripDate('2026-10-12')).toMatch(/Oct|10/);
  });
});
