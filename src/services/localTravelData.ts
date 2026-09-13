import type { NewsPost, Place, PlaceLink, Trip, TripCollection } from '../types/database';
import {
  TravelDataError,
  shareUrlFor,
  type NewsLikeResult,
  type NewsPostCreateInput,
  type NewsPostUpdateInput,
  type PlaceCreateInput,
  type ShareResult,
  type PlaceLinkCreateInput,
  type PlaceLinkUpdateInput,
  type PlaceUpdateInput,
  type TravelDataClient,
  type TripCollectionCreateInput,
  type TripCollectionUpdateInput,
  type TripCreateInput,
  type TripUpdateInput,
} from './travelData';

const jsonHeaders = { 'Content-Type': 'application/json' };

const readMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json() as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

const errorCodeFromStatus = (status: number): TravelDataError['code'] => {
  if (status === 400) return 'validation_error';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  return 'data_error';
};

export const localApiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: init.body ? { ...jsonHeaders, ...init.headers } : init.headers,
  });

  if (!response.ok) {
    throw new TravelDataError(
      await readMessage(response, 'The local planner API could not complete the request.'),
      errorCodeFromStatus(response.status),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const get = <T>(path: string) => localApiRequest<T>(path);
const post = <T>(path: string, body?: unknown) => localApiRequest<T>(path, {
  method: 'POST',
  body: body === undefined ? undefined : JSON.stringify(body),
});
const patch = <T>(path: string, body: unknown) => localApiRequest<T>(path, {
  method: 'PATCH',
  body: JSON.stringify(body),
});
const del = (path: string) => localApiRequest<void>(path, { method: 'DELETE' });

const nullOnNotFound = <T>(error: unknown): T | null => {
  if (error instanceof TravelDataError && error.code === 'not_found') return null;
  throw error;
};

export const createLocalTravelDataClient = (): TravelDataClient => ({
  listTrips: () => get<Trip[]>('/trips'),
  createTrip: (input: TripCreateInput) => post<Trip>('/trips', input),
  updateTrip: (id: string, input: TripUpdateInput) => patch<Trip>(`/trips/${id}`, input),
  deleteTrip: (id: string) => del(`/trips/${id}`),
  getTrip: (tripId: string) => get<Trip>(`/trips/${tripId}`).catch(nullOnNotFound<Trip>),
  shareTrip: async (id: string): Promise<ShareResult> => {
    const trip = await post<Trip>(`/trips/${id}/share`);
    if (!trip.share_token) throw new TravelDataError('Could not create a share link.', 'data_error');
    return { share_token: trip.share_token, url: shareUrlFor(trip.share_token) };
  },
  unshareTrip: (id: string) => localApiRequest<Trip>(`/trips/${id}/share`, { method: 'DELETE' }),

  listPlaces: (tripId: string) => get<Place[]>(`/trips/${tripId}/places`),
  createPlace: (tripId: string, input: PlaceCreateInput) => post<Place>(`/trips/${tripId}/places`, input),
  updatePlace: (id: string, input: PlaceUpdateInput) => patch<Place>(`/places/${id}`, input),
  deletePlace: (id: string) => del(`/places/${id}`),

  listPlaceLinks: (tripId: string) => get<PlaceLink[]>(`/trips/${tripId}/links`),
  createPlaceLink: (tripId: string, input: PlaceLinkCreateInput) => post<PlaceLink>(`/trips/${tripId}/links`, input),
  updatePlaceLink: (id: string, input: PlaceLinkUpdateInput) => patch<PlaceLink>(`/links/${id}`, input),
  deletePlaceLink: (id: string) => del(`/links/${id}`),

  listTripCollections: () => get<TripCollection[]>('/collections'),
  createTripCollection: (input: TripCollectionCreateInput) => post<TripCollection>('/collections', input),
  updateTripCollection: (id: string, input: TripCollectionUpdateInput) => patch<TripCollection>(`/collections/${id}`, input),
  updateTripCollectionStatus: (id: string, status) => patch<TripCollection>(`/collections/${id}`, { status }),
  deleteTripCollection: (id: string) => del(`/collections/${id}`),

  listNewsPosts: () => get<NewsPost[]>('/news'),
  getNewsPost: (slug: string) => get<NewsPost>(`/news/${slug}`).catch(nullOnNotFound<NewsPost>),
  toggleNewsLike: (slug: string) => post<NewsLikeResult>(`/news/${slug}/like`),
  createNewsPost: (input: NewsPostCreateInput) => post<NewsPost>('/news', input),
  updateNewsPost: (slug: string, input: NewsPostUpdateInput) => patch<NewsPost>(`/news/${slug}`, input),
  deleteNewsPost: (slug: string) => del(`/news/${slug}`),
});
