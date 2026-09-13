import { describe, expect, it } from 'vitest';
import { getTravelTips } from './travelTips';

describe('getTravelTips', () => {
  it('returns Penang-specific tips for a Penang destination', () => {
    const tips = getTravelTips('Penang, Malaysia');
    expect(tips.some((tip) => tip.toLowerCase().includes('penang'))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(getTravelTips('MELAKA')).toEqual(getTravelTips('melaka'));
  });

  it('falls back to generic tips for an unrecognized destination', () => {
    const tips = getTravelTips('Tokyo, Japan');
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.some((tip) => tip.toLowerCase().includes('penang'))).toBe(false);
  });
});
