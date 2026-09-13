import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(process.env.LOCAL_DB_PATH ?? '.local/travel-planner.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Schema v3 adds profiles, sharing, scheduled places, user news posts and the Google cache. The local
// SQLite file is prototype-only, so an older database is dropped and recreated rather than migrated.
const schemaVersion = 3;

const currentVersion = db.pragma('user_version', { simple: true });
if (currentVersion !== schemaVersion) {
  const tables = db.prepare("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'").all();
  db.pragma('foreign_keys = OFF');
  for (const table of tables) {
    db.prepare(`drop table if exists "${table.name}"`).run();
  }
  db.pragma('foreign_keys = ON');
  if (tables.length > 0) {
    console.log(`Local database reset from schema v${currentVersion} to v${schemaVersion}.`);
  }
}

db.exec(`
create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  full_name text,
  avatar_url text,
  gender text check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'self_describe')),
  gender_detail text,
  birth_date text,
  home_city text,
  country text not null default 'Malaysia',
  bio text,
  created_at text not null,
  updated_at text not null
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at text not null,
  created_at text not null
);

create table if not exists trips (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  destination text not null,
  region text,
  cover_image text,
  start_date text not null,
  end_date text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  share_token text unique,
  shared_at text,
  created_at text not null
);

create table if not exists places (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  catalog_id text,
  name text not null,
  address text,
  latitude real,
  longitude real,
  source text not null default 'manual',
  notes text,
  photo_url text,
  rating real,
  label text,
  day_number integer,
  start_time text,
  position_x real not null default 0,
  position_y real not null default 0,
  created_at text not null
);

create table if not exists place_links (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  source_place_id text not null references places(id) on delete cascade,
  target_place_id text not null references places(id) on delete cascade,
  transport_mode text not null default 'walk'
    check (transport_mode in ('walk', 'car', 'bus', 'train')),
  created_at text not null,
  unique (source_place_id, target_place_id)
);

create table if not exists trip_collections (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  destination text not null,
  status text not null default 'want_to_go' check (status in ('want_to_go', 'visited')),
  notes text,
  visited_at text,
  created_at text not null
);

create table if not exists news_posts (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  city text not null,
  category text not null check (category in ('cafe', 'restaurant', 'attraction', 'event', 'trip')),
  author text not null,
  published_at text not null,
  cover_image text not null,
  base_likes integer not null default 0,
  kind text not null default 'editorial' check (kind in ('editorial', 'trip')),
  user_id text references users(id) on delete cascade,
  trip_id text references trips(id) on delete cascade,
  share_token text
);

create table if not exists shared_snapshots (
  token text primary key,
  payload text not null,
  created_at text not null
);

create table if not exists google_place_cache (
  catalog_id text primary key,
  place_id text,
  photo_name text,
  photo_attribution text,
  details_json text,
  fetched_at text not null
);

create table if not exists news_likes (
  post_id text not null references news_posts(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  created_at text not null,
  primary key (post_id, user_id)
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists trips_user_id_start_date_idx on trips(user_id, start_date);
create index if not exists places_trip_id_created_at_idx on places(trip_id, created_at);
create index if not exists place_links_trip_id_idx on place_links(trip_id);
create index if not exists trip_collections_user_id_status_created_idx on trip_collections(user_id, status, created_at desc);
create index if not exists news_posts_published_at_idx on news_posts(published_at desc);
create index if not exists news_posts_user_id_idx on news_posts(user_id);
create index if not exists trips_share_token_idx on trips(share_token);
`);

db.pragma(`user_version = ${schemaVersion}`);

export const nowIso = () => new Date().toISOString();

export const normalizeText = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

export const validateTripDates = (startDate, endDate) => {
  if (!startDate || !endDate || Number.isNaN(Date.parse(`${startDate}T00:00:00`)) || Number.isNaN(Date.parse(`${endDate}T00:00:00`))) {
    const error = new Error('Start date and end date are required.');
    error.status = 400;
    throw error;
  }

  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
    const error = new Error('End date must be after the start date.');
    error.status = 400;
    throw error;
  }
};

export const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const ownedTrip = (userId, tripId) => db
  .prepare('select * from trips where id = ? and user_id = ?')
  .get(tripId, userId);

export const requireOwnedTrip = (userId, tripId) => {
  const trip = ownedTrip(userId, tripId);
  if (!trip) throw httpError(404, 'Trip was not found or is not available to this account.');
  return trip;
};

const ownedTables = new Set(['places', 'place_links']);

export const requireOwnedRecord = (userId, table, id) => {
  if (!ownedTables.has(table)) throw new Error(`Unsupported table: ${table}`);

  const row = db.prepare(`
    select ${table}.*
    from ${table}
    join trips on trips.id = ${table}.trip_id
    where ${table}.id = ? and trips.user_id = ?
  `).get(id, userId);

  if (!row) throw httpError(404, 'Item was not found or is not available to this account.');

  return row;
};
