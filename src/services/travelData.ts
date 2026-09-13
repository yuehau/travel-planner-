import type {
  NewsPost,
  Place,
  PlaceLink,
  TransportMode,
  Trip,
  TripCollection,
  TripCollectionStatus,
  TripPlanStatus,
} from '../types/database';

export type TripCreateInput = {
  destination: string;
  region?: string | null;
  cover_image?: string | null;
  start_date: string;
  end_date: string;
  description?: string;
};

export type TripUpdateInput = Partial<TripCreateInput> & { status?: TripPlanStatus };

export type PlaceCreateInput = {
  name: string;
  catalog_id?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
  notes?: string | null;
  photo_url?: string | null;
  rating?: number | null;
  label?: string | null;
  day_number?: number | null;
  start_time?: string | null;
  position_x?: number;
  position_y?: number;
};

export type PlaceUpdateInput = Partial<PlaceCreateInput>;

export type ShareResult = {
  share_token: string;
  url: string;
};

export type NewsPostCreateInput = {
  trip_id: string;
  title: string;
  body: string;
};

export type NewsPostUpdateInput = Partial<Pick<NewsPostCreateInput, 'title' | 'body'>>;

export type PlaceLinkCreateInput = {
  source_place_id: string;
  target_place_id: string;
  transport_mode?: TransportMode;
};

export type PlaceLinkUpdateInput = {
  transport_mode?: TransportMode;
};

export type TripCollectionCreateInput = {
  destination: string;
  status?: TripCollectionStatus;
  notes?: string;
  visited_at?: string;
};

export type TripCollectionUpdateInput = Partial<TripCollectionCreateInput>;

export type NewsLikeResult = {
  like_count: number;
  liked: boolean;
};

export type TravelDataClient = {
  listTrips: () => Promise<Trip[]>;
  createTrip: (input: TripCreateInput) => Promise<Trip>;
  updateTrip: (id: string, input: TripUpdateInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  getTrip: (tripId: string) => Promise<Trip | null>;
  shareTrip: (id: string) => Promise<ShareResult>;
  unshareTrip: (id: string) => Promise<Trip>;
  listPlaces: (tripId: string) => Promise<Place[]>;
  createPlace: (tripId: string, input: PlaceCreateInput) => Promise<Place>;
  updatePlace: (id: string, input: PlaceUpdateInput) => Promise<Place>;
  deletePlace: (id: string) => Promise<void>;
  listPlaceLinks: (tripId: string) => Promise<PlaceLink[]>;
  createPlaceLink: (tripId: string, input: PlaceLinkCreateInput) => Promise<PlaceLink>;
  updatePlaceLink: (id: string, input: PlaceLinkUpdateInput) => Promise<PlaceLink>;
  deletePlaceLink: (id: string) => Promise<void>;
  listTripCollections: () => Promise<TripCollection[]>;
  createTripCollection: (input: TripCollectionCreateInput) => Promise<TripCollection>;
  updateTripCollection: (id: string, input: TripCollectionUpdateInput) => Promise<TripCollection>;
  updateTripCollectionStatus: (id: string, status: TripCollectionStatus) => Promise<TripCollection>;
  deleteTripCollection: (id: string) => Promise<void>;
  listNewsPosts: () => Promise<NewsPost[]>;
  getNewsPost: (slug: string) => Promise<NewsPost | null>;
  toggleNewsLike: (slug: string) => Promise<NewsLikeResult>;
  createNewsPost: (input: NewsPostCreateInput) => Promise<NewsPost>;
  updateNewsPost: (slug: string, input: NewsPostUpdateInput) => Promise<NewsPost>;
  deleteNewsPost: (slug: string) => Promise<void>;
};

export class TravelDataError extends Error {
  code: 'not_found' | 'data_error' | 'validation_error' | 'conflict';

  constructor(message: string, code: TravelDataError['code']) {
    super(message);
    this.code = code;
    this.name = 'TravelDataError';
  }
}

export const normalizeOptional = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const removeUndefined = <T extends Record<string, unknown>>(value: T) => {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
};

export const requireText = (value: string | undefined | null, label: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new TravelDataError(`${label} is required.`, 'validation_error');
  }

  return trimmed;
};

export const validateTripDates = (startDate: string, endDate: string) => {
  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
    throw new TravelDataError('End date must be after the start date.', 'validation_error');
  }
};

export const validateRating = (rating: number | null | undefined) => {
  if (rating === null || rating === undefined) return null;
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    throw new TravelDataError('Rating must be between 0 and 5.', 'validation_error');
  }

  return rating;
};

export const validateDayNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 1 || value > 60) {
    throw new TravelDataError('Day must be a whole number between 1 and 60.', 'validation_error');
  }
  return value;
};

export const shareUrlFor = (token: string) => `${typeof window === 'undefined' ? '' : window.location.origin}/shared/${token}`;

export const validatePosition = (value: number | undefined, fallback = 0) => {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) {
    throw new TravelDataError('Board position must be a number.', 'validation_error');
  }

  return value;
};

export const getVisitedAt = (status: TripCollectionStatus, visitedAt?: string) => {
  if (status === 'want_to_go') return null;
  return normalizeOptional(visitedAt) ?? new Date().toISOString();
};

export const notAvailableInRemoteMode = (feature: string) => new TravelDataError(
  `${feature} is not available in remote (Supabase) mode yet. Use local or demo mode.`,
  'data_error',
);
