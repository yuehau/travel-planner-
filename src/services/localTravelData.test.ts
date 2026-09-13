import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalTravelDataClient, localApiRequest } from './localTravelData';
import { TravelDataError } from './travelData';

const jsonResponse = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  ...init,
});

describe('localTravelData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates board places with their canvas position', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ id: 'place-1', trip_id: 'trip-1', position_x: 120, position_y: 40 }));

    const client = createLocalTravelDataClient();
    const place = await client.createPlace('trip-1', { name: 'Batu Caves', catalog_id: 'kl-batu-caves', position_x: 120, position_y: 40 });

    expect(place.position_x).toBe(120);
    expect(fetchMock).toHaveBeenCalledWith('/api/trips/trip-1/places', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ name: 'Batu Caves', catalog_id: 'kl-batu-caves', position_x: 120, position_y: 40 }),
    }));
  });

  it('sends route vehicle updates to the links endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      id: 'link-1',
      trip_id: 'trip-1',
      source_place_id: 'place-1',
      target_place_id: 'place-2',
      transport_mode: 'train',
      created_at: '2026-01-01T00:00:00.000Z',
    }));

    const client = createLocalTravelDataClient();
    const link = await client.updatePlaceLink('link-1', { transport_mode: 'train' });

    expect(link.transport_mode).toBe('train');
    expect(fetchMock).toHaveBeenCalledWith('/api/links/link-1', expect.objectContaining({
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ transport_mode: 'train' }),
    }));
  });

  it('toggles news likes with a bodyless POST', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ like_count: 129, liked: true }));

    const client = createLocalTravelDataClient();
    await expect(client.toggleNewsLike('bangsar-slow-bar-opens')).resolves.toEqual({ like_count: 129, liked: true });
    expect(fetchMock).toHaveBeenCalledWith('/api/news/bangsar-slow-bar-opens/like', expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });

  it('shares a trip through the share endpoint and publishes news posts', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ id: 'trip-1', destination: 'KL', share_token: 'tok-123' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'post-1', slug: 'my-plan-abc', kind: 'trip', share_token: 'tok-123' }, { status: 201 }));

    const client = createLocalTravelDataClient();
    const share = await client.shareTrip('trip-1');
    expect(share).toEqual({ share_token: 'tok-123', url: expect.stringContaining('/shared/tok-123') });
    expect(fetchMock).toHaveBeenCalledWith('/api/trips/trip-1/share', expect.objectContaining({ method: 'POST', credentials: 'include' }));

    const post = await client.createNewsPost({ trip_id: 'trip-1', title: 'My plan', body: 'Look guys' });
    expect(post.slug).toBe('my-plan-abc');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/news', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ trip_id: 'trip-1', title: 'My plan', body: 'Look guys' }),
    }));
  });

  it('returns null for missing trips and posts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ message: 'Post was not found.' }, { status: 404 }));

    const client = createLocalTravelDataClient();
    await expect(client.getNewsPost('nope')).resolves.toBeNull();
    await expect(client.getTrip('nope')).resolves.toBeNull();
  });

  it('maps API failures to TravelDataError codes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ message: 'Trip name is required.' }, { status: 400 }));
    await expect(localApiRequest('/trips')).rejects.toMatchObject({
      name: 'TravelDataError',
      code: 'validation_error',
      message: 'Trip name is required.',
    } satisfies Partial<TravelDataError>);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse({ message: 'These places are already connected.' }, { status: 409 }));
    await expect(localApiRequest('/trips/t/links')).rejects.toMatchObject({ code: 'conflict' });
  });
});
