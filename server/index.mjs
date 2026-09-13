import argon2 from 'argon2';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { parseCookie, stringifySetCookie } from 'cookie';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  db,
  httpError,
  normalizeText,
  nowIso,
  requireOwnedRecord,
  requireOwnedTrip,
  validateTripDates,
} from './db.mjs';
import { streamTripPdf } from './pdf.mjs';
import { fetchPhotoBuffer, getDetails, isGooglePhotosEnabled, streamPhoto } from './google.mjs';
import { catalog, seedTripsForUser, syncNewsPosts } from './seed.mjs';

const port = Number(process.env.LOCAL_API_PORT ?? 5175);
const sessionCookie = 'tp_session';
const weekMs = 1000 * 60 * 60 * 24 * 7;

const text = z.string().trim().min(1);
const optionalText = z.string().optional().nullable();
const transportMode = z.enum(['walk', 'car', 'bus', 'train']);

const tripSchema = z.object({
  destination: text,
  region: optionalText,
  cover_image: optionalText,
  start_date: text,
  end_date: text,
  description: optionalText,
  status: z.enum(['draft', 'complete']).optional(),
});

const placeSchema = z.object({
  name: text,
  catalog_id: optionalText,
  address: optionalText,
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
  source: z.string().optional(),
  notes: optionalText,
  photo_url: optionalText,
  rating: z.number().finite().min(0).max(5).nullable().optional(),
  label: optionalText,
  day_number: z.number().int().min(1).max(60).nullable().optional(),
  start_time: optionalText,
  position_x: z.number().finite().optional(),
  position_y: z.number().finite().optional(),
});

const linkSchema = z.object({
  source_place_id: text,
  target_place_id: text,
  transport_mode: transportMode.optional(),
});

const linkUpdateSchema = z.object({
  transport_mode: transportMode,
});

const collectionSchema = z.object({
  destination: text,
  status: z.enum(['want_to_go', 'visited']).optional(),
  notes: optionalText,
  visited_at: optionalText,
});

const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  full_name: z.string().trim().optional(),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80).optional(),
  avatar_url: z.string().max(200_000).regex(/^data:image\/(png|jpeg|webp);base64,/).nullable().optional(),
  gender: z.enum(['female', 'male', 'non_binary', 'prefer_not_to_say', 'self_describe']).nullable().optional(),
  gender_detail: z.string().trim().max(40).nullable().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  home_city: z.string().trim().max(80).nullable().optional(),
  country: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(280).nullable().optional(),
});

const newsPostSchema = z.object({
  trip_id: text,
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(4000),
});

const boardPayloadSchema = z.object({
  trip: z.object({
    id: z.string(),
    destination: text,
    region: optionalText,
    cover_image: optionalText,
    start_date: text,
    end_date: text,
    description: optionalText,
    status: z.enum(['draft', 'complete']).optional(),
  }).passthrough(),
  places: z.array(z.object({
    id: z.string(),
    catalog_id: optionalText,
    name: text,
    address: optionalText,
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    notes: optionalText,
    photo_url: optionalText,
    rating: z.number().nullable().optional(),
    label: optionalText,
    day_number: z.number().int().nullable().optional(),
    start_time: optionalText,
    position_x: z.number().optional(),
    position_y: z.number().optional(),
    created_at: z.string().optional(),
  }).passthrough()).max(200),
  links: z.array(z.object({
    id: z.string(),
    source_place_id: z.string(),
    target_place_id: z.string(),
    transport_mode: transportMode,
    created_at: z.string().optional(),
  }).passthrough()).max(400),
  owner: z.object({ full_name: optionalText, avatar_url: optionalText }).nullable().optional(),
});

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public (no session) endpoints: shared boards, Google media, PDF rendering, demo snapshots.
const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
});

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const toApiError = (error) => {
  if (error instanceof z.ZodError) {
    return { status: 400, message: error.issues[0]?.message ?? 'Invalid request.' };
  }
  return { status: error.status ?? 500, message: error.message ?? 'Something went wrong.' };
};

const setSessionCookie = (res, id, expiresAt) => {
  res.setHeader('Set-Cookie', stringifySetCookie({
    name: sessionCookie,
    value: id,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  }));
};

const clearSessionCookie = (res) => {
  res.setHeader('Set-Cookie', stringifySetCookie({
    name: sessionCookie,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }));
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
});

const publicProfile = (user) => ({
  id: user.id,
  full_name: user.full_name ?? user.email,
  avatar_url: user.avatar_url,
  gender: user.gender ?? null,
  gender_detail: user.gender_detail ?? null,
  birth_date: user.birth_date ?? null,
  home_city: user.home_city ?? null,
  country: user.country ?? 'Malaysia',
  bio: user.bio ?? null,
  email: user.email,
  updated_at: user.updated_at,
});

const ownerSummary = (user) => ({
  full_name: user?.full_name ?? null,
  avatar_url: user?.avatar_url ?? null,
});

const catalogById = new Map(catalog.map((place) => [place.id, place]));
const requireCatalogPlace = (id) => {
  const place = catalogById.get(id);
  if (!place) throw httpError(404, 'Unknown catalog place.');
  return place;
};

const createSession = (userId) => {
  const id = nanoid(40);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + weekMs).toISOString();
  db.prepare('insert into sessions (id, user_id, expires_at, created_at) values (?, ?, ?, ?)')
    .run(id, userId, expiresAt, createdAt);
  return { id, expiresAt };
};

const currentSession = (req) => {
  const cookies = parseCookie(req.headers.cookie ?? '');
  const sessionId = cookies[sessionCookie];
  if (!sessionId) return null;

  const row = db.prepare(`
    select sessions.id as session_id, sessions.expires_at, users.*
    from sessions
    join users on users.id = sessions.user_id
    where sessions.id = ?
  `).get(sessionId);

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('delete from sessions where id = ?').run(sessionId);
    return null;
  }
  return row;
};

const requireAuth = (req, res, next) => {
  const session = currentSession(req);
  if (!session) {
    clearSessionCookie(res);
    res.status(401).json({ message: 'Sign in to continue.' });
    return;
  }
  req.user = publicUser(session);
  req.profile = publicProfile(session);
  next();
};

const seedDemoUser = async () => {
  const email = 'demo@travelplanner.local';
  const existing = db.prepare('select id from users where email = ?').get(email);
  if (existing) {
    seedTripsForUser(existing.id);
    return;
  }

  const userId = 'local-demo-user';
  const createdAt = nowIso();
  const passwordHash = await argon2.hash('TravelPlanner123!');
  db.prepare(`
    insert into users (id, email, password_hash, full_name, avatar_url, created_at, updated_at)
    values (?, ?, ?, ?, null, ?, ?)
  `).run(userId, email, passwordHash, 'Demo Traveler', createdAt, createdAt);
  seedTripsForUser(userId);
};

const updateRow = (table, id, input, columns) => {
  const entries = Object.entries(input).filter(([key, value]) => columns.includes(key) && value !== undefined);
  if (entries.length === 0) throw httpError(400, 'No supported fields were provided.');

  const setSql = entries.map(([key]) => `${key} = ?`).join(', ');
  db.prepare(`update ${table} set ${setSql} where id = ?`).run(...entries.map(([, value]) => value), id);
};

const getPlace = (id) => db.prepare('select * from places where id = ?').get(id);
const getLink = (id) => db.prepare('select * from place_links where id = ?').get(id);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/signup', authLimiter, asyncRoute(async (req, res) => {
  const input = authSchema.parse(req.body);
  const email = input.email.toLowerCase();
  const existing = db.prepare('select id from users where email = ?').get(email);
  if (existing) throw httpError(409, 'An account already exists for this email.');

  const id = nanoid();
  const timestamp = nowIso();
  const passwordHash = await argon2.hash(input.password);
  db.prepare(`
    insert into users (id, email, password_hash, full_name, avatar_url, created_at, updated_at)
    values (?, ?, ?, ?, null, ?, ?)
  `).run(id, email, passwordHash, normalizeText(input.full_name) ?? email, timestamp, timestamp);

  const session = createSession(id);
  setSessionCookie(res, session.id, session.expiresAt);
  const user = db.prepare('select * from users where id = ?').get(id);
  res.status(201).json({ user: publicUser(user), profile: publicProfile(user) });
}));

app.post('/api/auth/signin', authLimiter, asyncRoute(async (req, res) => {
  const input = authSchema.pick({ email: true, password: true }).parse(req.body);
  const user = db.prepare('select * from users where email = ?').get(input.email.toLowerCase());
  if (!user || !(await argon2.verify(user.password_hash, input.password))) {
    throw httpError(401, 'Email or password is incorrect.');
  }

  const session = createSession(user.id);
  setSessionCookie(res, session.id, session.expiresAt);
  res.json({ user: publicUser(user), profile: publicProfile(user) });
}));

app.post('/api/auth/signout', (req, res) => {
  const cookies = parseCookie(req.headers.cookie ?? '');
  if (cookies[sessionCookie]) {
    db.prepare('delete from sessions where id = ?').run(cookies[sessionCookie]);
  }
  clearSessionCookie(res);
  res.status(204).end();
});

app.get('/api/auth/session', (req, res) => {
  const session = currentSession(req);
  if (!session) {
    clearSessionCookie(res);
    res.json({ user: null, profile: null });
    return;
  }
  res.json({ user: publicUser(session), profile: publicProfile(session) });
});

// Public ---------------------------------------------------------------------------------------

app.get('/api/config', (_req, res) => {
  res.json({ googlePhotos: isGooglePhotosEnabled() });
});

app.get('/api/catalog/:id/photo', publicLimiter, asyncRoute(async (req, res) => {
  await streamPhoto(res, requireCatalogPlace(req.params.id), req.query.w);
}));

app.get('/api/catalog/:id/details', publicLimiter, asyncRoute(async (req, res) => {
  const details = await getDetails(requireCatalogPlace(req.params.id));
  if (!details) throw httpError(404, 'Google details are not configured.');
  res.json(details);
}));

const boardForTrip = (trip) => ({
  trip,
  places: db.prepare('select * from places where trip_id = ? order by created_at asc').all(trip.id),
  links: db.prepare('select * from place_links where trip_id = ? order by created_at asc').all(trip.id),
});

app.get('/api/shared/:token', publicLimiter, (req, res) => {
  const trip = db.prepare('select * from trips where share_token = ?').get(req.params.token);
  if (trip) {
    const owner = db.prepare('select full_name, avatar_url from users where id = ?').get(trip.user_id);
    res.json({ token: req.params.token, ...boardForTrip(trip), owner: ownerSummary(owner), snapshot: false });
    return;
  }

  const snapshot = db.prepare('select * from shared_snapshots where token = ?').get(req.params.token);
  if (!snapshot) throw httpError(404, 'This shared plan is not available.');
  const payload = JSON.parse(snapshot.payload);
  res.json({ token: req.params.token, ...payload, owner: ownerSummary(payload.owner), snapshot: true });
});

app.post('/api/shared', publicLimiter, asyncRoute(async (req, res) => {
  const payload = boardPayloadSchema.parse(req.body);
  const token = nanoid(16);
  db.prepare('insert into shared_snapshots (token, payload, created_at) values (?, ?, ?)')
    .run(token, JSON.stringify(payload), nowIso());
  res.status(201).json({ token });
}));

app.post('/api/export/pdf', publicLimiter, asyncRoute(async (req, res) => {
  const payload = boardPayloadSchema.parse(req.body);
  const photos = new Map();
  if (isGooglePhotosEnabled()) {
    await Promise.all(payload.places.map(async (place) => {
      const catalogPlace = place.catalog_id ? catalogById.get(place.catalog_id) : null;
      if (!catalogPlace) return;
      const buffer = await fetchPhotoBuffer(catalogPlace, 320);
      if (buffer) photos.set(place.id, buffer);
    }));
  }
  const filename = `travel-plan-${payload.trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'trip'}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  streamTripPdf(res, { ...payload, photos });
}));

app.use('/api', requireAuth);

// Profile --------------------------------------------------------------------------------------

app.get('/api/profile', (req, res) => {
  const user = db.prepare('select * from users where id = ?').get(req.user.id);
  res.json({ profile: publicProfile(user) });
});

app.patch('/api/profile', asyncRoute(async (req, res) => {
  const input = profileSchema.parse(req.body);
  updateRow('users', req.user.id, {
    full_name: input.full_name,
    avatar_url: input.avatar_url,
    gender: input.gender,
    gender_detail: input.gender === 'self_describe' ? normalizeText(input.gender_detail) : (input.gender === undefined ? undefined : null),
    birth_date: input.birth_date,
    home_city: input.home_city === undefined ? undefined : normalizeText(input.home_city),
    country: input.country,
    bio: input.bio === undefined ? undefined : normalizeText(input.bio),
    updated_at: nowIso(),
  }, ['full_name', 'avatar_url', 'gender', 'gender_detail', 'birth_date', 'home_city', 'country', 'bio', 'updated_at']);
  const user = db.prepare('select * from users where id = ?').get(req.user.id);
  res.json({ profile: publicProfile(user) });
}));

// Trips ---------------------------------------------------------------------------------------

app.get('/api/trips', (req, res) => {
  const trips = db.prepare('select * from trips where user_id = ? order by start_date asc').all(req.user.id);
  res.json(trips);
});

app.post('/api/trips', asyncRoute(async (req, res) => {
  const input = tripSchema.parse(req.body);
  validateTripDates(input.start_date, input.end_date);
  const id = nanoid();
  db.prepare(`
    insert into trips (id, user_id, destination, region, cover_image, start_date, end_date, description, created_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.user.id,
    input.destination,
    normalizeText(input.region),
    normalizeText(input.cover_image),
    input.start_date,
    input.end_date,
    normalizeText(input.description),
    nowIso(),
  );
  res.status(201).json(db.prepare('select * from trips where id = ?').get(id));
}));

app.get('/api/trips/:tripId', (req, res) => {
  res.json(requireOwnedTrip(req.user.id, req.params.tripId));
});

app.patch('/api/trips/:tripId', asyncRoute(async (req, res) => {
  const current = requireOwnedTrip(req.user.id, req.params.tripId);
  const input = tripSchema.partial().parse(req.body);
  validateTripDates(input.start_date ?? current.start_date, input.end_date ?? current.end_date);
  updateRow('trips', req.params.tripId, {
    destination: input.destination,
    region: input.region === undefined ? undefined : normalizeText(input.region),
    cover_image: input.cover_image === undefined ? undefined : normalizeText(input.cover_image),
    start_date: input.start_date,
    end_date: input.end_date,
    description: input.description === undefined ? undefined : normalizeText(input.description),
    status: input.status,
  }, ['destination', 'region', 'cover_image', 'start_date', 'end_date', 'description', 'status']);
  res.json(requireOwnedTrip(req.user.id, req.params.tripId));
}));

app.post('/api/trips/:tripId/share', (req, res) => {
  const trip = requireOwnedTrip(req.user.id, req.params.tripId);
  if (!trip.share_token) {
    db.prepare('update trips set share_token = ?, shared_at = ? where id = ?').run(nanoid(16), nowIso(), trip.id);
  }
  res.json(requireOwnedTrip(req.user.id, trip.id));
});

app.delete('/api/trips/:tripId/share', (req, res) => {
  const trip = requireOwnedTrip(req.user.id, req.params.tripId);
  db.prepare('update trips set share_token = null, shared_at = null where id = ?').run(trip.id);
  db.prepare("update news_posts set share_token = null where trip_id = ? and kind = 'trip'").run(trip.id);
  res.json(requireOwnedTrip(req.user.id, trip.id));
});

app.delete('/api/trips/:tripId', (req, res) => {
  requireOwnedTrip(req.user.id, req.params.tripId);
  db.prepare('delete from trips where id = ? and user_id = ?').run(req.params.tripId, req.user.id);
  res.status(204).end();
});

// Board places ---------------------------------------------------------------------------------

app.get('/api/trips/:tripId/places', (req, res) => {
  requireOwnedTrip(req.user.id, req.params.tripId);
  res.json(db.prepare('select * from places where trip_id = ? order by created_at asc').all(req.params.tripId));
});

app.post('/api/trips/:tripId/places', asyncRoute(async (req, res) => {
  requireOwnedTrip(req.user.id, req.params.tripId);
  const input = placeSchema.parse(req.body);
  const id = nanoid();
  db.prepare(`
    insert into places
      (id, trip_id, catalog_id, name, address, latitude, longitude, source, notes, photo_url, rating, label, day_number, start_time, position_x, position_y, created_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.params.tripId,
    normalizeText(input.catalog_id),
    input.name,
    normalizeText(input.address),
    input.latitude ?? null,
    input.longitude ?? null,
    normalizeText(input.source) ?? 'manual',
    normalizeText(input.notes),
    normalizeText(input.photo_url),
    input.rating ?? null,
    normalizeText(input.label),
    input.day_number ?? null,
    normalizeText(input.start_time),
    input.position_x ?? 0,
    input.position_y ?? 0,
    nowIso(),
  );
  res.status(201).json(getPlace(id));
}));

app.patch('/api/places/:id', asyncRoute(async (req, res) => {
  const place = requireOwnedRecord(req.user.id, 'places', req.params.id);
  const input = placeSchema.partial().parse(req.body);
  updateRow('places', req.params.id, {
    catalog_id: input.catalog_id === undefined ? undefined : normalizeText(input.catalog_id),
    name: input.name,
    address: input.address === undefined ? undefined : normalizeText(input.address),
    latitude: input.latitude,
    longitude: input.longitude,
    source: input.source,
    notes: input.notes === undefined ? undefined : normalizeText(input.notes),
    photo_url: input.photo_url === undefined ? undefined : normalizeText(input.photo_url),
    rating: input.rating,
    label: input.label === undefined ? undefined : normalizeText(input.label),
    day_number: input.day_number,
    start_time: input.start_time === undefined ? undefined : normalizeText(input.start_time),
    position_x: input.position_x,
    position_y: input.position_y,
  }, ['catalog_id', 'name', 'address', 'latitude', 'longitude', 'source', 'notes', 'photo_url', 'rating', 'label', 'day_number', 'start_time', 'position_x', 'position_y']);
  res.json(getPlace(place.id));
}));

app.delete('/api/places/:id', (req, res) => {
  requireOwnedRecord(req.user.id, 'places', req.params.id);
  db.prepare('delete from places where id = ?').run(req.params.id);
  res.status(204).end();
});

// Board links ----------------------------------------------------------------------------------

app.get('/api/trips/:tripId/links', (req, res) => {
  requireOwnedTrip(req.user.id, req.params.tripId);
  res.json(db.prepare('select * from place_links where trip_id = ? order by created_at asc').all(req.params.tripId));
});

app.post('/api/trips/:tripId/links', asyncRoute(async (req, res) => {
  requireOwnedTrip(req.user.id, req.params.tripId);
  const input = linkSchema.parse(req.body);
  const source = getPlace(input.source_place_id);
  const target = getPlace(input.target_place_id);

  if (!source || !target || source.trip_id !== req.params.tripId || target.trip_id !== req.params.tripId) {
    throw httpError(400, 'Both places must be on this board.');
  }
  if (source.id === target.id) throw httpError(400, 'A place cannot link to itself.');

  const duplicate = db.prepare('select id from place_links where source_place_id = ? and target_place_id = ?').get(source.id, target.id);
  if (duplicate) throw httpError(409, 'These places are already connected.');

  const id = nanoid();
  db.prepare(`
    insert into place_links (id, trip_id, source_place_id, target_place_id, transport_mode, created_at)
    values (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.tripId, source.id, target.id, input.transport_mode ?? 'walk', nowIso());
  res.status(201).json(getLink(id));
}));

app.patch('/api/links/:id', asyncRoute(async (req, res) => {
  const link = requireOwnedRecord(req.user.id, 'place_links', req.params.id);
  const input = linkUpdateSchema.parse(req.body);
  updateRow('place_links', link.id, { transport_mode: input.transport_mode }, ['transport_mode']);
  res.json(getLink(link.id));
}));

app.delete('/api/links/:id', (req, res) => {
  requireOwnedRecord(req.user.id, 'place_links', req.params.id);
  db.prepare('delete from place_links where id = ?').run(req.params.id);
  res.status(204).end();
});

// Collections ----------------------------------------------------------------------------------

app.get('/api/collections', (req, res) => {
  res.json(db.prepare('select * from trip_collections where user_id = ? order by created_at desc').all(req.user.id));
});

app.post('/api/collections', asyncRoute(async (req, res) => {
  const input = collectionSchema.parse(req.body);
  const status = input.status ?? 'want_to_go';
  const id = nanoid();
  db.prepare(`
    insert into trip_collections (id, user_id, destination, status, notes, visited_at, created_at)
    values (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, input.destination, status, normalizeText(input.notes), status === 'visited' ? normalizeText(input.visited_at) ?? nowIso() : null, nowIso());
  res.status(201).json(db.prepare('select * from trip_collections where id = ?').get(id));
}));

app.patch('/api/collections/:id', asyncRoute(async (req, res) => {
  const collection = db.prepare('select * from trip_collections where id = ? and user_id = ?').get(req.params.id, req.user.id);
  if (!collection) throw httpError(404, 'Saved destination was not found.');
  const input = collectionSchema.partial().parse(req.body);
  const status = input.status ?? collection.status;
  updateRow('trip_collections', req.params.id, {
    destination: input.destination,
    status: input.status,
    notes: input.notes === undefined ? undefined : normalizeText(input.notes),
    visited_at: input.status === undefined ? input.visited_at : (status === 'visited' ? normalizeText(input.visited_at) ?? nowIso() : null),
  }, ['destination', 'status', 'notes', 'visited_at']);
  res.json(db.prepare('select * from trip_collections where id = ?').get(req.params.id));
}));

app.delete('/api/collections/:id', (req, res) => {
  db.prepare('delete from trip_collections where id = ? and user_id = ?').run(req.params.id, req.user.id);
  res.status(204).end();
});

// News -----------------------------------------------------------------------------------------

const newsPostQuery = `
  select
    news_posts.*,
    users.full_name as author_name,
    users.avatar_url as author_avatar,
    news_posts.base_likes + (select count(*) from news_likes where news_likes.post_id = news_posts.id) as like_count,
    exists (select 1 from news_likes where news_likes.post_id = news_posts.id and news_likes.user_id = ?) as liked,
    (news_posts.user_id = ?) as is_mine
  from news_posts
  left join users on users.id = news_posts.user_id
`;

const mapNewsPost = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  body: JSON.parse(row.body),
  city: row.city,
  category: row.category,
  author: row.kind === 'trip' ? (row.author_name ?? row.author) : row.author,
  author_avatar: row.author_avatar ?? null,
  published_at: row.published_at,
  cover_image: row.cover_image,
  kind: row.kind,
  user_id: row.user_id ?? null,
  trip_id: row.trip_id ?? null,
  share_token: row.share_token ?? null,
  is_mine: Boolean(row.is_mine),
  like_count: Number(row.like_count),
  liked: Boolean(row.liked),
});

const requireNewsPost = (userId, slug) => {
  const row = db.prepare(`${newsPostQuery} where news_posts.slug = ?`).get(userId, userId, slug);
  if (!row) throw httpError(404, 'Post was not found.');
  return row;
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'plan';
const excerptOf = (body) => (body.length > 160 ? `${body.slice(0, 157).trimEnd()}…` : body);
const paragraphsOf = (body) => body.split(/\n{2,}|\r?\n/).map((line) => line.trim()).filter(Boolean);

app.get('/api/news', (req, res) => {
  const rows = db.prepare(`${newsPostQuery} order by news_posts.published_at desc, news_posts.rowid desc`).all(req.user.id, req.user.id);
  res.json(rows.map(mapNewsPost));
});

app.post('/api/news', asyncRoute(async (req, res) => {
  const input = newsPostSchema.parse(req.body);
  const trip = requireOwnedTrip(req.user.id, input.trip_id);
  if (!trip.share_token) {
    db.prepare('update trips set share_token = ?, shared_at = ? where id = ?').run(nanoid(16), nowIso(), trip.id);
  }
  const sharedTrip = requireOwnedTrip(req.user.id, trip.id);
  const id = nanoid();
  const slug = `${slugify(input.title)}-${id.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, 'x')}`;
  db.prepare(`
    insert into news_posts (id, slug, title, excerpt, body, city, category, author, published_at, cover_image, base_likes, kind, user_id, trip_id, share_token)
    values (?, ?, ?, ?, ?, ?, 'trip', ?, ?, ?, 0, 'trip', ?, ?, ?)
  `).run(
    id,
    slug,
    input.title,
    excerptOf(input.body),
    JSON.stringify(paragraphsOf(input.body)),
    sharedTrip.region ?? 'Malaysia',
    req.profile.full_name ?? 'Traveler',
    nowIso().slice(0, 10),
    sharedTrip.cover_image ?? '/regions/kuala-lumpur.svg',
    req.user.id,
    sharedTrip.id,
    sharedTrip.share_token,
  );
  res.status(201).json(mapNewsPost(requireNewsPost(req.user.id, slug)));
}));

app.patch('/api/news/:slug', asyncRoute(async (req, res) => {
  const post = requireNewsPost(req.user.id, req.params.slug);
  if (post.user_id !== req.user.id) throw httpError(403, 'You can only edit your own posts.');
  const input = newsPostSchema.pick({ title: true, body: true }).partial().parse(req.body);
  updateRow('news_posts', post.id, {
    title: input.title,
    excerpt: input.body === undefined ? undefined : excerptOf(input.body),
    body: input.body === undefined ? undefined : JSON.stringify(paragraphsOf(input.body)),
  }, ['title', 'excerpt', 'body']);
  res.json(mapNewsPost(requireNewsPost(req.user.id, req.params.slug)));
}));

app.delete('/api/news/:slug', (req, res) => {
  const post = requireNewsPost(req.user.id, req.params.slug);
  if (post.user_id !== req.user.id) throw httpError(403, 'You can only delete your own posts.');
  db.prepare('delete from news_posts where id = ?').run(post.id);
  res.status(204).end();
});

app.get('/api/news/:slug', (req, res) => {
  res.json(mapNewsPost(requireNewsPost(req.user.id, req.params.slug)));
});

app.post('/api/news/:slug/like', (req, res) => {
  const post = requireNewsPost(req.user.id, req.params.slug);
  if (post.liked) {
    db.prepare('delete from news_likes where post_id = ? and user_id = ?').run(post.id, req.user.id);
  } else {
    db.prepare('insert into news_likes (post_id, user_id, created_at) values (?, ?, ?)').run(post.id, req.user.id, nowIso());
  }
  const updated = mapNewsPost(requireNewsPost(req.user.id, req.params.slug));
  res.json({ like_count: updated.like_count, liked: updated.liked });
});

app.use((error, _req, res, _next) => {
  const apiError = toApiError(error);
  if (apiError.status >= 500) {
    console.error(error);
  }
  res.status(apiError.status).json({ message: apiError.message });
});

syncNewsPosts();
await seedDemoUser();

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Local TravelPlanner API running on http://127.0.0.1:${port}`);
  console.log('Seed account: demo@travelplanner.local / TravelPlanner123!');
});
server.on('error', (error) => {
  console.error('Could not start local TravelPlanner API:', error);
  process.exitCode = 1;
});
globalThis.travelPlannerLocalServer = server;
