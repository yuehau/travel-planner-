import { z } from 'zod';
import catalogJson from '../../shared/malaysia-catalog.json';
import type { PlaceCreateInput } from '../services/travelData';

export const catalogRegions = [
  'Kuala Lumpur',
  'Selangor',
  'Penang',
  'Langkawi',
  'Malacca',
  'Cameron Highlands',
  'Ipoh',
  'Johor',
  'Pahang',
  'Terengganu',
  'Kelantan',
  'Sarawak',
  'Sabah',
] as const;
export const catalogCategories = ['landmark', 'food', 'cafe', 'nature', 'beach', 'culture', 'nightlife', 'shopping'] as const;

export type CatalogRegion = (typeof catalogRegions)[number];
export type CatalogCategory = (typeof catalogCategories)[number];

const reviewSchema = z.object({
  author: z.string().min(1),
  rating: z.number().min(0).max(5),
  text: z.string().min(1),
  date: z.string().min(1),
});

const catalogPlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  region: z.enum(catalogRegions),
  category: z.enum(catalogCategories),
  vibes: z.array(z.string()),
  description: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  reviews: z.array(reviewSchema),
  openingHours: z.string().optional(),
  priceLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  popular: z.boolean().optional(),
  image: z.string().min(1),
});

export type CatalogPlace = z.infer<typeof catalogPlaceSchema>;
export type CatalogReview = z.infer<typeof reviewSchema>;

export const catalogPlaces: CatalogPlace[] = z.array(catalogPlaceSchema).parse(catalogJson);

const catalogById = new Map(catalogPlaces.map((place) => [place.id, place]));

export const getCatalogPlace = (id: string | null | undefined) => (id ? catalogById.get(id) ?? null : null);

export const popularPlaces = catalogPlaces.filter((place) => place.popular);

export const regionSlug = (region: string) => region.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const regionCoverImage = (region: string | null | undefined) => (
  region ? `/regions/${regionSlug(region)}.svg` : '/regions/kuala-lumpur.svg'
);

export const categoryLabels: Record<CatalogCategory, string> = {
  landmark: 'Landmark',
  food: 'Food',
  cafe: 'Café',
  nature: 'Nature',
  beach: 'Beach',
  culture: 'Culture',
  nightlife: 'Nightlife',
  shopping: 'Shopping',
};

export type CatalogFilters = {
  region?: CatalogRegion | 'all';
  category?: CatalogCategory | 'all';
};

export const searchCatalog = (query: string, filters: CatalogFilters = {}) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return catalogPlaces.filter((place) => {
    if (filters.region && filters.region !== 'all' && place.region !== filters.region) return false;
    if (filters.category && filters.category !== 'all' && place.category !== filters.category) return false;
    if (terms.length === 0) return true;

    const haystack = [place.name, place.city, place.region, place.category, ...place.vibes].join(' ').toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
};

export const priceLevelLabel = (level: CatalogPlace['priceLevel']) => (level ? 'RM'.repeat(level) : null);

/** Snapshot a catalog entry into a board place at the given canvas position. */
export const placeInputFromCatalog = (place: CatalogPlace, position: { x: number; y: number }): PlaceCreateInput => ({
  name: place.name,
  catalog_id: place.id,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  source: 'catalog',
  photo_url: place.image,
  rating: place.rating,
  position_x: Math.round(position.x),
  position_y: Math.round(position.y),
});
