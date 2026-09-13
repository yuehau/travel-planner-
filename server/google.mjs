// Google Places (New) integration: photos and details are fetched live and never stored;
// only place ids / photo resource names / details JSON are cached for up to 30 days.
import { db, httpError, nowIso } from './db.mjs';

const apiKey = () => process.env.GOOGLE_PLACES_API_KEY?.trim() || null;
const cacheTtlMs = 1000 * 60 * 60 * 24 * 30;
// Failed lookups (bad key, quota, network) are remembered briefly so a board of cards does not hammer Google.
const failureTtlMs = 1000 * 60 * 5;
const recentFailures = new Map();
// Once Google rejects the key itself, stop advertising photos so clients use illustrations directly.
let keyRejected = false;

export const isGooglePhotosEnabled = () => Boolean(apiKey()) && !keyRejected;

const fieldMask = [
  'places.id',
  'places.rating',
  'places.userRatingCount',
  'places.reviews',
  'places.googleMapsUri',
  'places.editorialSummary',
  'places.photos',
].join(',');

const readCache = (catalogId) => {
  const row = db.prepare('select * from google_place_cache where catalog_id = ?').get(catalogId);
  if (!row) return null;
  if (Date.now() - new Date(row.fetched_at).getTime() > cacheTtlMs) return null;
  return { ...row, details: row.details_json ? JSON.parse(row.details_json) : null };
};

const writeCache = (catalogId, entry) => {
  db.prepare(`
    insert into google_place_cache (catalog_id, place_id, photo_name, photo_attribution, details_json, fetched_at)
    values (?, ?, ?, ?, ?, ?)
    on conflict(catalog_id) do update set
      place_id = excluded.place_id,
      photo_name = excluded.photo_name,
      photo_attribution = excluded.photo_attribution,
      details_json = excluded.details_json,
      fetched_at = excluded.fetched_at
  `).run(catalogId, entry.place_id, entry.photo_name, entry.photo_attribution, JSON.stringify(entry.details), nowIso());
};

const toDetails = (catalogPlace, googlePlace, photo) => ({
  catalog_id: catalogPlace.id,
  place_id: googlePlace?.id ?? null,
  rating: googlePlace?.rating ?? null,
  review_count: googlePlace?.userRatingCount ?? null,
  reviews: (googlePlace?.reviews ?? []).slice(0, 5).map((review) => ({
    author: review.authorAttribution?.displayName ?? 'Google user',
    rating: review.rating ?? 0,
    text: review.text?.text ?? review.originalText?.text ?? '',
    date: (review.publishTime ?? '').slice(0, 10),
    relative_time: review.relativePublishTimeDescription ?? undefined,
  })).filter((review) => review.text),
  google_maps_uri: googlePlace?.googleMapsUri ?? null,
  summary: googlePlace?.editorialSummary?.text ?? null,
  photo_attribution: photo?.authorAttributions?.map((entry) => entry.displayName).filter(Boolean).join(', ') || null,
  has_photo: Boolean(photo?.name),
});

/** Resolves (and caches) the Google place for a catalog entry. Returns null when the API is off. */
export const resolvePlace = async (catalogPlace) => {
  const key = apiKey();
  if (!key) return null;

  const cached = readCache(catalogPlace.id);
  if (cached) return cached;

  const failedUntil = recentFailures.get(catalogPlace.id);
  if (failedUntil && failedUntil > Date.now()) throw httpError(502, 'Google Places is temporarily unavailable for this place.');

  let response;
  try {
    response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: `${catalogPlace.name}, ${catalogPlace.address}`,
        maxResultCount: 1,
        locationBias: {
          circle: { center: { latitude: catalogPlace.latitude, longitude: catalogPlace.longitude }, radius: 5000 },
        },
      }),
    });
  } catch (networkError) {
    recentFailures.set(catalogPlace.id, Date.now() + failureTtlMs);
    console.error('Google Places request failed:', networkError.message);
    throw httpError(502, 'Could not reach Google Places.');
  }

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    recentFailures.set(catalogPlace.id, Date.now() + failureTtlMs);
    if (!keyRejected && (response.status === 403 || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED'))) {
      keyRejected = true;
      console.error('GOOGLE_PLACES_API_KEY was rejected by Google; falling back to illustrations. Check the key, the Places API (New) enablement and billing.');
    } else if (recentFailures.size <= 3) {
      console.error('Google Places search failed:', response.status, message.slice(0, 300));
    }
    throw httpError(502, 'Could not reach Google Places.');
  }

  const data = await response.json();
  const googlePlace = data.places?.[0] ?? null;
  const photo = googlePlace?.photos?.[0] ?? null;
  const entry = {
    place_id: googlePlace?.id ?? null,
    photo_name: photo?.name ?? null,
    photo_attribution: photo?.authorAttributions?.map((item) => item.displayName).filter(Boolean).join(', ') || null,
    details: toDetails(catalogPlace, googlePlace, photo),
  };
  writeCache(catalogPlace.id, entry);
  return entry;
};

export const getDetails = async (catalogPlace) => {
  const entry = await resolvePlace(catalogPlace);
  return entry?.details ?? null;
};

/** Streams the first Google photo for a place. Bytes pass through; nothing is written to disk. */
export const streamPhoto = async (res, catalogPlace, maxWidthPx = 800) => {
  const key = apiKey();
  const entry = await resolvePlace(catalogPlace);
  if (!key || !entry?.photo_name) throw httpError(404, 'No Google photo for this place.');

  const width = Math.min(Math.max(Number(maxWidthPx) || 800, 160), 1600);
  const upstream = await fetch(`https://places.googleapis.com/v1/${entry.photo_name}/media?maxWidthPx=${width}&key=${encodeURIComponent(key)}`);
  if (!upstream.ok || !upstream.body) throw httpError(502, 'Could not load the Google photo.');

  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.end(buffer);
};

/** Fetches a small photo as a Buffer for PDF thumbnails; null when unavailable. */
export const fetchPhotoBuffer = async (catalogPlace, maxWidthPx = 320) => {
  try {
    const key = apiKey();
    const entry = await resolvePlace(catalogPlace);
    if (!key || !entry?.photo_name) return null;
    const upstream = await fetch(`https://places.googleapis.com/v1/${entry.photo_name}/media?maxWidthPx=${maxWidthPx}&key=${encodeURIComponent(key)}`);
    if (!upstream.ok) return null;
    const type = upstream.headers.get('content-type') ?? '';
    if (!/jpeg|png/.test(type)) return null;
    return Buffer.from(await upstream.arrayBuffer());
  } catch {
    return null;
  }
};
