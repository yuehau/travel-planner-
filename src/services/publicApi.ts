import type { GooglePlaceDetails, Place, PlaceLink, SharedBoard, Trip } from '../types/database';
import { TravelDataError } from './travelData';

/**
 * Endpoints that work without a session: runtime config, shared boards, Google place media,
 * demo snapshots and PDF rendering. Used by demo mode, shared pages and the board itself.
 */

export type AppConfig = { googlePhotos: boolean };

let configPromise: Promise<AppConfig> | null = null;

const readMessage = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json() as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

const codeFromStatus = (status: number): TravelDataError['code'] => {
  if (status === 400) return 'validation_error';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  return 'data_error';
};

const publicRequest = async <T>(path: string, init: RequestInit = {}, fallback = 'The request could not be completed.'): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (!response.ok) {
    throw new TravelDataError(await readMessage(response, fallback), codeFromStatus(response.status));
  }
  return response.json() as Promise<T>;
};

/** Fetched once per page load; the server tells us whether Google photos are configured. */
export const fetchConfig = () => {
  configPromise ??= publicRequest<AppConfig>('/config').catch(() => ({ googlePhotos: false }));
  return configPromise;
};

export const resetConfigCache = () => {
  configPromise = null;
};

export const googlePhotoUrl = (catalogId: string, maxWidthPx = 800) => `/api/catalog/${encodeURIComponent(catalogId)}/photo?w=${maxWidthPx}`;

export const fetchGoogleDetails = (catalogId: string) => publicRequest<GooglePlaceDetails>(`/catalog/${encodeURIComponent(catalogId)}/details`, {}, 'Could not load Google details.');

export const fetchSharedBoard = async (token: string): Promise<SharedBoard | null> => {
  try {
    return await publicRequest<SharedBoard>(`/shared/${encodeURIComponent(token)}`, {}, 'This shared plan is not available.');
  } catch (error) {
    if (error instanceof TravelDataError && error.code === 'not_found') return null;
    throw error;
  }
};

export type SnapshotPayload = {
  trip: Trip;
  places: Place[];
  links: PlaceLink[];
  owner: { full_name: string | null; avatar_url: string | null };
};

/** Demo boards live in the browser, so sharing uploads a snapshot the server can serve to others. */
export const uploadSharedSnapshot = (payload: SnapshotPayload) => publicRequest<{ token: string }>('/shared', {
  method: 'POST',
  body: JSON.stringify(payload),
}, 'Could not create a share link.');

export type PdfPayload = {
  trip: Trip;
  places: Place[];
  links: PlaceLink[];
  owner?: { full_name: string | null; avatar_url: string | null } | null;
};

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const pdfFilenameFor = (trip: Pick<Trip, 'destination'>) => (
  `travel-plan-${trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'trip'}.pdf`
);

/** Renders the board to PDF on the server from the data we already have, so every mode can export. */
export const downloadTripPdf = async (payload: PdfPayload) => {
  const response = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new TravelDataError(await readMessage(response, 'Could not export this plan.'), codeFromStatus(response.status));
  }
  saveBlob(await response.blob(), pdfFilenameFor(payload.trip));
};
