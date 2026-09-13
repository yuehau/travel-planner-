// Shared seed content: the Malaysia catalog, three demo trips and the news posts.
// The client imports the same JSON files from shared/, so both modes show identical data.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { db } from './db.mjs';

const root = resolve(import.meta.dirname, '..');
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));

export const catalog = readJson('shared/malaysia-catalog.json');
export const seedTrips = readJson('shared/seed-trips.json');
export const newsPosts = readJson('shared/news-posts.json');

const catalogById = new Map(catalog.map((place) => [place.id, place]));

export const regionSlug = (region) => region.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const regionCoverImage = (region) => (region ? `/regions/${regionSlug(region)}.svg` : null);

const seedCreatedAt = (index) => new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();

const insertTrip = db.prepare(`
  insert into trips (id, user_id, destination, region, cover_image, start_date, end_date, description, status, created_at)
  values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertPlace = db.prepare(`
  insert into places
    (id, trip_id, catalog_id, name, address, latitude, longitude, source, notes, photo_url, rating, day_number, start_time, position_x, position_y, created_at)
  values (?, ?, ?, ?, ?, ?, ?, 'catalog', ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertLink = db.prepare(`
  insert into place_links (id, trip_id, source_place_id, target_place_id, transport_mode, created_at)
  values (?, ?, ?, ?, ?, ?)
`);
const insertCollection = db.prepare(`
  insert into trip_collections (id, user_id, destination, status, notes, visited_at, created_at)
  values (?, ?, ?, ?, ?, ?, ?)
`);

/** Seeds the three Malaysian trips for a user who has none yet. Ids are prefixed so seeds stay unique per user. */
export const seedTripsForUser = db.transaction((userId, idPrefix = 'local') => {
  const existingTripCount = db.prepare('select count(*) as count from trips where user_id = ?').get(userId).count;
  if (existingTripCount > 0) return;

  seedTrips.forEach((seed, tripIndex) => {
    const tripId = `${idPrefix}-${seed.id}`;
    insertTrip.run(tripId, userId, seed.destination, seed.region, regionCoverImage(seed.region), seed.start_date, seed.end_date, seed.description, seed.status ?? 'draft', seedCreatedAt(tripIndex));

    seed.places.forEach((seedPlace, placeIndex) => {
      const place = catalogById.get(seedPlace.catalog_id);
      if (!place) throw new Error(`Seed place ${seedPlace.catalog_id} is missing from the catalog.`);
      insertPlace.run(
        `${idPrefix}-${seedPlace.id}`,
        tripId,
        place.id,
        place.name,
        place.address,
        place.latitude,
        place.longitude,
        seedPlace.notes,
        place.image,
        place.rating,
        seedPlace.day ?? null,
        seedPlace.time ?? null,
        seedPlace.position[0],
        seedPlace.position[1],
        seedCreatedAt(tripIndex * 100 + placeIndex),
      );
    });

    seed.links.forEach((seedLink, linkIndex) => {
      insertLink.run(
        `${idPrefix}-${seedLink.id}`,
        tripId,
        `${idPrefix}-${seedLink.source}`,
        `${idPrefix}-${seedLink.target}`,
        seedLink.transport_mode,
        seedCreatedAt(tripIndex * 100 + linkIndex),
      );
    });
  });

  insertCollection.run(`${idPrefix}-collection-cameron`, userId, 'Cameron Highlands', 'want_to_go', 'Tea terraces and cold mornings after KL.', null, seedCreatedAt(500));
  insertCollection.run(`${idPrefix}-collection-malacca`, userId, 'Malacca', 'visited', 'Jonker night market was the highlight.', '2026-05-10T00:00:00.000Z', seedCreatedAt(501));
});

const upsertNewsPost = db.prepare(`
  insert into news_posts (id, slug, title, excerpt, body, city, category, author, published_at, cover_image, base_likes, kind)
  values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'editorial')
  on conflict(id) do update set
    slug = excluded.slug,
    title = excluded.title,
    excerpt = excluded.excerpt,
    body = excluded.body,
    city = excluded.city,
    category = excluded.category,
    author = excluded.author,
    published_at = excluded.published_at,
    cover_image = excluded.cover_image,
    base_likes = excluded.base_likes
`);

/** Keeps the news table in sync with shared/news-posts.json; likes are preserved by post id. */
export const syncNewsPosts = db.transaction(() => {
  for (const post of newsPosts) {
    upsertNewsPost.run(post.id, post.slug, post.title, post.excerpt, JSON.stringify(post.body), post.city, post.category, post.author, post.publishedAt, post.coverImage, post.baseLikes);
  }
});

