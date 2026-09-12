import { describe, expect, it } from 'vitest';
import { tripTabs } from './tripTabs';

describe('trip detail tabs', () => {
  it('exposes planning tools without a booking workflow', () => {
    expect(tripTabs.map((tab) => tab.label)).toEqual([
      'Itinerary',
      'Mind Map',
      'Places',
      'Budget',
      'Packing',
      'To-Dos',
      'Essentials',
      'Sharing',
      'Settings',
    ]);
    expect(tripTabs.map((tab) => tab.id)).not.toContain('reservations');
    expect(tripTabs.map((tab) => tab.label)).not.toContain('Bookings');
  });
});
