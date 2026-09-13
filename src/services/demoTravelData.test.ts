import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoTravelDataClient, getDemoProfile, resetDemoStore, updateDemoProfile } from './demoTravelData';
import { TravelDataError } from './travelData';
import { getCatalogPlace } from '../data/catalog';

const tokyoLike = { x: 100, y: 200 };

describe('demo travel data client', () => {
  beforeEach(() => {
    resetDemoStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('seeds three Malaysian boards with places and routes', async () => {
    const client = createDemoTravelDataClient();
    const trips = await client.listTrips();

    expect(trips.map((trip) => trip.destination)).toEqual([
      'Penang Heritage & Street Food',
      'KL City Lights',
      'Langkawi Island Escape',
    ]);
    expect(trips.map((trip) => trip.region)).toEqual(['Penang', 'Kuala Lumpur', 'Langkawi']);
    expect(trips.every((trip) => trip.cover_image?.startsWith('/regions/'))).toBe(true);

    const places = await client.listPlaces('seed-kl-city-lights');
    const links = await client.listPlaceLinks('seed-kl-city-lights');
    expect(places).toHaveLength(7);
    expect(links).toHaveLength(6);
    expect(links.map((link) => link.transport_mode)).toContain('train');
    expect(places[0]).toMatchObject({ catalog_id: 'kl-batu-caves', position_x: 0, position_y: 140, source: 'catalog', day_number: 1, start_time: '08:00' });
    expect(trips.find((trip) => trip.id === 'seed-penang-heritage')?.status).toBe('complete');
  });

  it('edits card details, duplicates snapshots and adds custom places', async () => {
    const client = createDemoTravelDataClient();
    const [first] = await client.listPlaces('seed-kl-city-lights');

    const edited = await client.updatePlace(first.id, { label: 'Morning caves', day_number: 1, start_time: '08:30', notes: 'Bring water' });
    expect(edited).toMatchObject({ label: 'Morning caves', day_number: 1, start_time: '08:30', notes: 'Bring water', name: first.name });
    await expect(client.updatePlace(first.id, { day_number: 0 })).rejects.toMatchObject({ code: 'validation_error' });
    const cleared = await client.updatePlace(first.id, { label: '', day_number: null });
    expect(cleared.label).toBeNull();
    expect(cleared.day_number).toBeNull();

    const custom = await client.createPlace('seed-kl-city-lights', { name: "Grandma's house", address: 'Jalan Ipoh', source: 'custom', position_x: 5, position_y: 6 });
    expect(custom).toMatchObject({ source: 'custom', catalog_id: null, name: "Grandma's house" });
    await expect(client.listPlaces('seed-kl-city-lights')).resolves.toHaveLength(8);
  });

  it('marks a plan complete and back to draft', async () => {
    const client = createDemoTravelDataClient();
    const complete = await client.updateTrip('seed-kl-city-lights', { status: 'complete' });
    expect(complete.status).toBe('complete');
    const draft = await client.updateTrip('seed-kl-city-lights', { status: 'draft' });
    expect(draft.status).toBe('draft');
  });

  it('shares a board by uploading a snapshot and publishes it to news', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ token: 'snap-token' }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    const client = createDemoTravelDataClient();

    const share = await client.shareTrip('seed-langkawi-escape');
    expect(share.share_token).toBe('snap-token');
    expect(share.url).toContain('/shared/snap-token');
    expect(fetchMock).toHaveBeenCalledWith('/api/shared', expect.objectContaining({ method: 'POST' }));
    await expect(client.getTrip('seed-langkawi-escape')).resolves.toMatchObject({ share_token: 'snap-token' });

    const post = await client.createNewsPost({ trip_id: 'seed-langkawi-escape', title: 'My Langkawi plan', body: 'Look guys, this is my plan.\n\nThoughts?' });
    expect(post).toMatchObject({ kind: 'trip', category: 'trip', is_mine: true, share_token: 'snap-token', city: 'Langkawi', like_count: 0 });
    expect(post.body).toEqual(['Look guys, this is my plan.', 'Thoughts?']);

    const listed = await client.listNewsPosts();
    expect(listed[0].slug).toBe(post.slug);
    expect(listed).toHaveLength(7);

    const updated = await client.updateNewsPost(post.slug, { title: 'My Langkawi plan (v2)' });
    expect(updated.title).toBe('My Langkawi plan (v2)');
    await expect(client.toggleNewsLike(post.slug)).resolves.toEqual({ like_count: 1, liked: true });

    await client.deleteNewsPost(post.slug);
    await expect(client.getNewsPost(post.slug)).resolves.toBeNull();
    await expect(client.updateNewsPost('bangsar-slow-bar-opens', { title: 'x' })).rejects.toMatchObject({ code: 'not_found' });

    const unshared = await client.unshareTrip('seed-langkawi-escape');
    expect(unshared.share_token).toBeNull();
  });

  it('persists the demo profile', () => {
    expect(getDemoProfile()).toMatchObject({ full_name: 'Demo Traveler', country: 'Malaysia' });
    const updated = updateDemoProfile({ full_name: 'Jun', gender: 'non_binary', home_city: 'Ipoh' });
    expect(updated).toMatchObject({ full_name: 'Jun', gender: 'non_binary', home_city: 'Ipoh' });
    expect(getDemoProfile().full_name).toBe('Jun');
  });

  it('adds a catalog place to the board at the dropped position', async () => {
    const client = createDemoTravelDataClient();
    const catalogPlace = getCatalogPlace('kl-thean-hou-temple');
    if (!catalogPlace) throw new Error('catalog place missing');

    const place = await client.createPlace('seed-kl-city-lights', {
      name: catalogPlace.name,
      catalog_id: catalogPlace.id,
      latitude: catalogPlace.latitude,
      longitude: catalogPlace.longitude,
      photo_url: catalogPlace.image,
      rating: catalogPlace.rating,
      position_x: tokyoLike.x,
      position_y: tokyoLike.y,
    });

    expect(place).toMatchObject({ trip_id: 'seed-kl-city-lights', catalog_id: 'kl-thean-hou-temple', position_x: 100, position_y: 200 });

    const moved = await client.updatePlace(place.id, { position_x: 420, position_y: 80 });
    expect(moved.position_x).toBe(420);
    expect(moved.position_y).toBe(80);
    expect(moved.name).toBe(catalogPlace.name);
  });

  it('connects places, rejects duplicates and self links, and updates the vehicle', async () => {
    const client = createDemoTravelDataClient();
    const tripId = 'seed-langkawi-escape';
    const [first, , third] = await client.listPlaces(tripId);

    const link = await client.createPlaceLink(tripId, { source_place_id: first.id, target_place_id: third.id });
    expect(link).toMatchObject({ trip_id: tripId, transport_mode: 'walk' });

    await expect(client.createPlaceLink(tripId, { source_place_id: first.id, target_place_id: third.id }))
      .rejects.toMatchObject({ code: 'conflict' });
    await expect(client.createPlaceLink(tripId, { source_place_id: first.id, target_place_id: first.id }))
      .rejects.toMatchObject({ code: 'validation_error' });
    await expect(client.createPlaceLink('seed-kl-city-lights', { source_place_id: first.id, target_place_id: third.id }))
      .rejects.toMatchObject({ code: 'validation_error' });

    const updated = await client.updatePlaceLink(link.id, { transport_mode: 'car' });
    expect(updated.transport_mode).toBe('car');

    await client.deletePlaceLink(link.id);
    await expect(client.listPlaceLinks(tripId)).resolves.toHaveLength(5);
  });

  it('removes routes attached to a deleted place and cleans up deleted trips', async () => {
    const client = createDemoTravelDataClient();
    const tripId = 'seed-penang-heritage';
    const places = await client.listPlaces(tripId);
    const streetArt = places.find((place) => place.catalog_id === 'pg-george-town-street-art');
    if (!streetArt) throw new Error('seed place missing');

    await client.deletePlace(streetArt.id);
    const links = await client.listPlaceLinks(tripId);
    expect(links.some((link) => link.source_place_id === streetArt.id || link.target_place_id === streetArt.id)).toBe(false);
    expect(links).toHaveLength(4);

    await client.deleteTrip(tripId);
    await expect(client.getTrip(tripId)).resolves.toBeNull();
    await expect(client.listPlaces(tripId)).resolves.toHaveLength(0);
    await expect(client.listPlaceLinks(tripId)).resolves.toHaveLength(0);
  });

  it('creates trips with a region cover and validates dates', async () => {
    const client = createDemoTravelDataClient();

    const trip = await client.createTrip({
      destination: 'Ipoh coffee crawl',
      region: 'Ipoh',
      cover_image: '/regions/ipoh.svg',
      start_date: '2026-12-01',
      end_date: '2026-12-03',
    });
    expect(trip).toMatchObject({ destination: 'Ipoh coffee crawl', region: 'Ipoh', cover_image: '/regions/ipoh.svg' });
    await expect(client.listPlaces(trip.id)).resolves.toHaveLength(0);

    await expect(client.createTrip({ destination: 'Backwards', start_date: '2026-12-05', end_date: '2026-12-01' }))
      .rejects.toBeInstanceOf(TravelDataError);
  });

  it('lists news posts and toggles likes for the demo user', async () => {
    const client = createDemoTravelDataClient();
    const posts = await client.listNewsPosts();

    expect(posts).toHaveLength(6);
    expect(posts[0].published_at >= posts[1].published_at).toBe(true);
    const post = posts.find((item) => item.slug === 'bangsar-slow-bar-opens');
    expect(post).toMatchObject({ like_count: 128, liked: false });

    await expect(client.toggleNewsLike('bangsar-slow-bar-opens')).resolves.toEqual({ like_count: 129, liked: true });
    await expect(client.getNewsPost('bangsar-slow-bar-opens')).resolves.toMatchObject({ like_count: 129, liked: true });
    await expect(client.toggleNewsLike('bangsar-slow-bar-opens')).resolves.toEqual({ like_count: 128, liked: false });
    await expect(client.getNewsPost('missing-post')).resolves.toBeNull();
    await expect(client.toggleNewsLike('missing-post')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('keeps collections working', async () => {
    const client = createDemoTravelDataClient();
    const seeded = await client.listTripCollections();
    expect(seeded.map((item) => item.destination)).toEqual(['Cameron Highlands', 'Malacca']);

    const created = await client.createTripCollection({ destination: 'Sabah', status: 'want_to_go' });
    const visited = await client.updateTripCollectionStatus(created.id, 'visited');
    expect(visited.visited_at).toEqual(expect.any(String));
    await client.deleteTripCollection(created.id);
    await expect(client.listTripCollections()).resolves.toHaveLength(2);
  });
});
