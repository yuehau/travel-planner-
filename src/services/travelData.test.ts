import { describe, expect, it } from 'vitest';
import { createDemoTravelDataClient, TravelDataError } from './travelData';

describe('demo travel data client', () => {
  it('lists demo trips through the same contract as Supabase data', async () => {
    const client = createDemoTravelDataClient();
    const trips = await client.listTrips();

    expect(client.isReadOnly).toBe(true);
    expect(trips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'demo-tokyo',
          destination: 'Tokyo, Japan',
          start_date: '2026-10-12',
        }),
      ]),
    );
  });

  it('loads child records for the selected demo trip', async () => {
    const client = createDemoTravelDataClient();

    await expect(client.listItineraryItems('demo-tokyo')).resolves.toHaveLength(2);
    await expect(client.listPlaces('demo-tokyo')).resolves.toHaveLength(2);
    await expect(client.listBudgetItems('demo-tokyo')).resolves.toHaveLength(3);
    await expect(client.listPackingItems('demo-tokyo')).resolves.toHaveLength(3);
    await expect(client.listTripInfos('demo-tokyo')).resolves.toHaveLength(3);
    await expect(client.listTodos('demo-tokyo')).resolves.toHaveLength(2);
    await expect(client.listTripMembers('demo-tokyo')).resolves.toHaveLength(2);
    await expect(client.listTripCollections()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          destination: 'Kyoto, Japan',
          status: 'want_to_go',
        }),
        expect.objectContaining({
          destination: 'Paris, France',
          status: 'visited',
        }),
      ]),
    );
    await expect(client.getUserSettings()).resolves.toMatchObject({
      currency: 'MYR',
      distance_unit: 'km',
    });
  });

  it('rejects writes in read-only demo mode', async () => {
    const client = createDemoTravelDataClient();

    await expect(client.createTrip({
      destination: 'Seoul, South Korea',
      start_date: '2026-11-01',
      end_date: '2026-11-05',
    })).rejects.toMatchObject({
      code: 'read_only',
      message: 'Demo mode is read-only. Sign in to save changes.',
    });
    await expect(client.createTripCollection({
      destination: 'Osaka, Japan',
      status: 'want_to_go',
    })).rejects.toMatchObject({
      code: 'read_only',
    });
  });

  it('uses explicit error codes for data errors', () => {
    const error = new TravelDataError('Nope', 'validation_error');

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('validation_error');
  });
});
