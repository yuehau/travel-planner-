import { z } from 'zod';
import seedJson from '../../shared/seed-trips.json';
import type { Place, PlaceLink, Trip, TripCollection } from '../types/database';
import { getCatalogPlace, regionCoverImage } from './catalog';

const seedTripSchema = z.object({
  id: z.string().min(1),
  destination: z.string().min(1),
  region: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(['draft', 'complete']).optional(),
  places: z.array(z.object({
    id: z.string().min(1),
    catalog_id: z.string().min(1),
    position: z.tuple([z.number(), z.number()]),
    notes: z.string().nullable(),
    day: z.number().int().min(1).optional(),
    time: z.string().optional(),
  })),
  links: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    transport_mode: z.enum(['walk', 'car', 'bus', 'train']),
  })),
});

export type SeedTrip = z.infer<typeof seedTripSchema>;

export const seedTrips: SeedTrip[] = z.array(seedTripSchema).parse(seedJson);

export const demoUserId = 'demo-user-id';

const seedCreatedAt = (index: number) => new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();

/** Expands the shared seed definition into full records for the given owner. */
export const buildSeedRecords = (userId: string) => {
  const trips: Trip[] = [];
  const places: Place[] = [];
  const links: PlaceLink[] = [];

  seedTrips.forEach((seed, tripIndex) => {
    trips.push({
      id: seed.id,
      user_id: userId,
      destination: seed.destination,
      region: seed.region,
      cover_image: regionCoverImage(seed.region),
      start_date: seed.start_date,
      end_date: seed.end_date,
      description: seed.description,
      status: seed.status ?? 'draft',
      share_token: null,
      created_at: seedCreatedAt(tripIndex),
    });

    seed.places.forEach((seedPlace, placeIndex) => {
      const catalogPlace = getCatalogPlace(seedPlace.catalog_id);
      if (!catalogPlace) throw new Error(`Seed place ${seedPlace.catalog_id} is missing from the catalog.`);

      places.push({
        id: seedPlace.id,
        trip_id: seed.id,
        catalog_id: catalogPlace.id,
        name: catalogPlace.name,
        address: catalogPlace.address,
        latitude: catalogPlace.latitude,
        longitude: catalogPlace.longitude,
        source: 'catalog',
        notes: seedPlace.notes,
        photo_url: catalogPlace.image,
        rating: catalogPlace.rating,
        label: null,
        day_number: seedPlace.day ?? null,
        start_time: seedPlace.time ?? null,
        position_x: seedPlace.position[0],
        position_y: seedPlace.position[1],
        created_at: seedCreatedAt(tripIndex * 100 + placeIndex),
      });
    });

    seed.links.forEach((seedLink, linkIndex) => {
      links.push({
        id: seedLink.id,
        trip_id: seed.id,
        source_place_id: seedLink.source,
        target_place_id: seedLink.target,
        transport_mode: seedLink.transport_mode,
        created_at: seedCreatedAt(tripIndex * 100 + linkIndex),
      });
    });
  });

  return { trips, places, links };
};

export const buildSeedCollections = (userId: string): TripCollection[] => [
  {
    id: 'demo-collection-cameron',
    user_id: userId,
    destination: 'Cameron Highlands',
    status: 'want_to_go',
    notes: 'Tea terraces and cold mornings after KL.',
    visited_at: null,
    created_at: seedCreatedAt(500),
  },
  {
    id: 'demo-collection-malacca',
    user_id: userId,
    destination: 'Malacca',
    status: 'visited',
    notes: 'Jonker night market was the highlight.',
    visited_at: '2026-05-10T00:00:00.000Z',
    created_at: seedCreatedAt(501),
  },
];
