// Shared tokens, data, icons, SVG morph paths and UI primitives for the TravelPlanner redesign artboards.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(here, '..', 'travel-planner--junxi');
const readJson = (file) => JSON.parse(readFileSync(path.join(appRoot, 'shared', file), 'utf8'));

// ---------- Real app data ----------
export const catalog = readJson('malaysia-catalog.json');
export const seedTrips = readJson('seed-trips.json');
export const newsSeeds = readJson('news-posts.json');
export const byId = new Map(catalog.map((place) => [place.id, place]));
export const popularPlaces = catalog.filter((place) => place.popular);
export const regions = ['Kuala Lumpur', 'Selangor', 'Penang', 'Langkawi', 'Malacca', 'Cameron Highlands', 'Ipoh', 'Johor', 'Pahang', 'Terengganu', 'Kelantan', 'Sarawak', 'Sabah'];

export const usedImages = new Set();
/** Registers an app image (web path like /places/x.svg) and returns the canvas file name. */
export const img = (webPath) => {
  const rel = webPath.replace(/^\//, '');
  usedImages.add(`travel-planner--junxi/public/${rel}`);
  return path.basename(rel);
};

export const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const categoryLabels = { landmark: 'Landmark', food: 'Food', cafe: 'Café', nature: 'Nature', beach: 'Beach', culture: 'Culture', nightlife: 'Nightlife', shopping: 'Shopping' };
export const newsCategoryLabels = { cafe: 'Café', restaurant: 'Restaurant', attraction: 'Attraction', event: 'Event', trip: 'Trip plan' };

export const fmtTripDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
export const fmtNewsDate = (value) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
export const fmtTime = (value) => {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2026, 0, 1, h, m));
};
export const fmtNum = (n) => n.toLocaleString('en-US');
export const priceLabel = (level) => (level ? 'RM'.repeat(level) : '');
export const regionSlug = (region) => region.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const regionCover = (region) => img(`/regions/${regionSlug(region ?? 'Kuala Lumpur')}.svg`);

export const TODAY = new Date('2026-09-13T12:00:00');
export const tripStatus = (start, end) => {
  const today = new Date(TODAY); today.setHours(0, 0, 0, 0);
  if (new Date(`${end}T23:59:59`) < today) return 'past';
  if (new Date(`${start}T00:00:00`) <= today) return 'active';
  return 'upcoming';
};
export const tripDayCount = (start, end) => Math.max(1, Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1);

// ---------- Route estimates (same formula as src/utils/routeEstimate.ts) ----------
export const transport = {
  walk: { label: 'Walk', icon: 'footprints', speed: 4.5, buffer: 0 },
  train: { label: 'Train', icon: 'train', speed: 55, buffer: 10 },
  bus: { label: 'Bus', icon: 'bus', speed: 22, buffer: 10 },
  car: { label: 'Car', icon: 'car', speed: 38, buffer: 5 },
};
export const modes = ['walk', 'train', 'bus', 'car'];
const rad = (d) => (d * Math.PI) / 180;
export const haversineKm = (a, b) => {
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const fmtDuration = (min) => (min < 60 ? `${min} min` : (min % 60 === 0 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 60)} h ${min % 60} min`));
const fmtDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`);
export const leg = (from, to, mode) => {
  const km = haversineKm(from, to);
  const minutes = Math.max(1, Math.round(((km * 1.25) / transport[mode].speed) * 60 + transport[mode].buffer));
  return { km, distance: fmtDistance(km), duration: fmtDuration(minutes) };
};

/** A seeded board with catalog data joined in. */
export const boardFor = (tripId) => {
  const trip = seedTrips.find((item) => item.id === tripId);
  const places = trip.places.map((p, index) => ({
    id: p.id, c: byId.get(p.catalog_id), x: p.position[0], y: p.position[1], notes: p.notes, day: p.day, time: p.time, order: index,
  }));
  const links = trip.links.map((l) => ({ id: l.id, source: l.source, target: l.target, mode: l.transport_mode }));
  return { trip, places, links, placeById: new Map(places.map((p) => [p.id, p])) };
};

/** Traveller reading order: roots first, then depth-first along links (port of orderPlacesByLinks). */
export const orderPlaces = ({ places, links }) => {
  const out = new Map();
  const incoming = new Map();
  for (const l of links) {
    out.set(l.source, [...(out.get(l.source) ?? []), l]);
    incoming.set(l.target, (incoming.get(l.target) ?? 0) + 1);
  }
  const ordered = [];
  const seen = new Set();
  const visit = (id) => {
    if (seen.has(id)) return;
    seen.add(id);
    const place = places.find((p) => p.id === id);
    if (!place) return;
    ordered.push(place);
    for (const l of out.get(id) ?? []) visit(l.target);
  };
  for (const p of places) if (!incoming.get(p.id)) visit(p.id);
  for (const p of places) visit(p.id);
  return ordered;
};

// ---------- Icons (Lucide geometry, 24px grid, 2px round stroke) ----------
const I = {
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  'pen-line': '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  'list-ordered': '<path d="M10 12h11"/><path d="M10 18h11"/><path d="M10 6h11"/><path d="M4 10h2"/><path d="M4 6h1v4"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  footprints: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
  train: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
  bus: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  compass: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  maximize: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
  fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
};

export const icon = (name, size = 16, cls = '', extra = '') => {
  if (!I[name]) throw new Error(`Unknown icon ${name}`);
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${I[name]}</svg>`;
};

// ---------- SVG morph paths (point-matched pairs) ----------
export const P = {
  PLANE: 'M12 2 C12.8 2 13.4 4.6 13.4 8.4 C13.4 8.4 20.8 14.2 20.8 14.2 C20.8 14.2 13.2 13 13.2 13 C13.2 16.2 13.4 18.2 15.4 20.3 C15.4 20.3 12 19.4 12 19.4 C12 19.4 8.6 20.3 8.6 20.3 C10.6 18.2 10.8 16.2 10.8 13 C10.8 13 3.2 14.2 3.2 14.2 C3.2 14.2 10.6 8.4 10.6 8.4 C10.6 4.6 11.2 2 12 2 Z M12 9.5 C12 9.5 12 9.5 12 9.5 C12 9.5 12 9.5 12 9.5 C12 9.5 12 9.5 12 9.5 C12 9.5 12 9.5 12 9.5 Z',
  PIN: 'M12 3 C13.72 3 15.38 3.68 16.6 4.9 C17.82 6.12 18.5 7.78 18.5 9.5 C18.5 11.2 18.2 12.2 17.6 13 C17 14.3 16 15.6 15 16.8 C14 18 12.6 20.3 12 21.5 C11.4 20.3 10 18 9 16.8 C8 15.6 7 14.3 6.4 13 C5.8 12.2 5.5 11.2 5.5 9.5 C5.5 7.78 6.18 6.12 7.4 4.9 C8.62 3.68 10.28 3 12 3 Z M12 7.1 C10.67 7.1 9.6 8.17 9.6 9.5 C9.6 10.83 10.67 11.9 12 11.9 C13.33 11.9 14.4 10.83 14.4 9.5 C14.4 8.17 13.33 7.1 12 7.1 Z',
  SUN: 'M12 8 C9.79 8 8 9.79 8 12 C8 14.21 9.79 16 12 16 C14.21 16 16 14.21 16 12 C16 9.79 14.21 8 12 8 Z',
  MOON: 'M12 3 C7.03 3 3 7.03 3 12 C3 16.97 7.03 21 12 21 C15.4 21 18.4 19.1 20 16.2 C14.2 17.6 8.4 10.6 12 3 Z',
  RAYS: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  COPY: 'M9 9 L21 9 L21 21 L9 21 L9 9',
  COPY_BACK: 'M5 15 L3 15 L3 3 L15 3 L15 5',
  CHECK: 'M5 12.5 L9.5 17 L19.5 7 L19.5 7 L19.5 7',
  CHEV_CLOSE: 'M16 9 L13 12 L16 15',
  CHEV_OPEN: 'M14 9 L17 12 L14 15',
  HEART: 'M12 20.5 C12 20.5 3 15 3 8.8 C3 6.1 5.1 4 7.7 4 C9.5 4 11.1 5 12 6.5 C12.9 5 14.5 4 16.3 4 C18.9 4 21 6.1 21 8.8 C21 15 12 20.5 12 20.5 Z',
  LINE: 'M4 10 C24 10 44 10 64 10 C84 10 104 10 124 10 C144 10 164 10 184 10',
  WAVE: 'M4 10 C24 3 44 17 64 10 C84 3 104 17 124 10 C144 3 164 17 184 10',
};
const NUM = /-?\d*\.?\d+/g;
const round = (v) => String(Math.round(v * 100) / 100);
export const lerpPath = (a, b, t) => {
  const nb = b.match(NUM).map(Number);
  let i = 0;
  return a.replace(NUM, (m) => round(Number(m) + (nb[i++] - Number(m)) * t));
};
export const scalePath = (a, k, cx = 12, cy = 12) => {
  let i = 0;
  return a.replace(NUM, (m) => round((i++ % 2 === 0 ? cx : cy) + (Number(m) - (i % 2 === 1 ? cx : cy)) * k));
};
P.DOT = scalePath(P.PIN, 0.3);

// ---------- Tokens + component CSS ----------
const morphCss = `
.mp{transition:d .28s var(--ease),fill .2s ease,opacity .2s ease,transform .28s var(--ease)}
.brandmark{display:flex;align-items:center;justify-content:center;flex:none;background:var(--brand-bg);color:#F5F8FE}
.brandmark .mp{d:path("${P.PLANE}");fill:#F5F8FE;fill-rule:evenodd}
.brand-hover:hover .brandmark .mp,.brandmark.to-pin .mp{d:path("${P.PIN}");fill:var(--coral)}
.tt{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;color:var(--muted);cursor:pointer}
.tt input,.mx input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.tt svg{transition:transform .32s var(--ease)}
.tt .core{d:path("${P.SUN}")}
.tt .rays{transform-box:fill-box;transform-origin:center}
.tt input:checked + svg{transform:rotate(-40deg)}
.tt input:checked + svg .core{d:path("${P.MOON}")}
.tt input:checked + svg .rays{opacity:0;transform:scale(.3)}
.like{position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--raised);font:600 12px/1 var(--body);color:var(--muted);cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.like.md{height:40px;padding:0 16px;font-size:14px}
.like input{position:absolute;opacity:0;pointer-events:none}
.like .mp{fill:transparent;transform-box:fill-box;transform-origin:center}
.like.on,.like:has(input:checked){background:var(--coral);border-color:var(--coral);color:var(--on-coral)}
.like.on .mp,.like:has(input:checked) .mp{fill:currentColor}
.like:has(input:checked) .mp{animation:pop .32s var(--ease)}
.like .n-on{display:none}.like:has(input:checked) .n-on{display:inline}.like:has(input:checked) .n-off{display:none}
@keyframes pop{0%{transform:scale(1)}45%{transform:scale(1.3)}100%{transform:scale(1)}}
.fab .mp{transform-box:fill-box;transform-origin:center}
.fab:has(input:checked) .mp{transform:rotate(135deg)}
.cc .front{d:path("${P.COPY}")}
.cc:has(input:checked) .front{d:path("${P.CHECK}")}
.cc:has(input:checked) .back{opacity:0}
.pt .chev{d:path("${P.CHEV_CLOSE}")}
.pt:has(input:checked) .chev{d:path("${P.CHEV_OPEN}")}
@keyframes loader-morph{0%,100%{d:path("${P.DOT}")}30%,40%{d:path("${P.PIN}")}65%,75%{d:path("${P.PLANE}")}}
@keyframes loader-lift{0%,100%{transform:translateY(0)}65%,75%{transform:translateY(-3px) rotate(10deg)}}
.loader .mp{fill:var(--primary);fill-rule:evenodd;transform-box:fill-box;transform-origin:center;animation:loader-morph 1.8s var(--ease) infinite,loader-lift 1.8s var(--ease) infinite}
@keyframes grow-pin{0%{d:path("${P.DOT}");transform:translate(var(--dx,0px),var(--dy,0px))}55%{d:path("${P.DOT}")}100%{d:path("${P.PIN}");transform:translate(0,0)}}
.pin-in{fill:var(--coral);fill-rule:evenodd;animation:grow-pin .9s var(--ease) both;animation-delay:var(--delay,0s)}
@keyframes draw{to{stroke-dashoffset:0}}
.route-draw{stroke-dasharray:var(--len,600);stroke-dashoffset:var(--len,600);animation:draw .9s .35s var(--ease) forwards}
@keyframes squiggle{to{d:path("${P.WAVE}")}}
.squiggle path{d:path("${P.LINE}");animation:squiggle .9s .5s var(--ease) forwards}
@media (prefers-reduced-motion: reduce){.mp,.pin-in,.route-draw,.squiggle path,.loader .mp{transition:none!important;animation-duration:1ms!important;animation-iteration-count:1!important}}
`;

export const baseCss = `
*{box-sizing:border-box}
:root,.light{--surface:#EDF2FB;--raised:#FFFFFF;--sunken:#E2EAFC;--ink:#1B2559;--muted:#4F5A86;--faint:#5F6994;--line:#D7E3FC;--line2:#B6CCFE;--primary:#4F6BD8;--primary-h:#3D57C2;--primary-ink:#3D57C2;--on-primary:#FFFFFF;--peri:#7F9BF2;--coral:#F0845C;--coral-h:#EC7447;--coral-deep:#C9532B;--coral-soft:#FDEBE3;--on-coral:#1B2559;--pos:#3E7A56;--pos-soft:#E6F2EA;--on-pos:#FFFFFF;--danger:#B83A55;--danger-soft:#FBE9EE;--star:#C9532B;--dot:#C3D3FB;--brand-bg:#1B2559;--scrim:rgb(14 20 48 / .5);--shadow-1:0 1px 2px rgb(27 37 89 / .06),0 4px 12px -6px rgb(27 37 89 / .14);--shadow-2:0 14px 34px -18px rgb(27 37 89 / .32);--shadow-3:0 34px 80px -30px rgb(27 37 89 / .5);--ease:cubic-bezier(.65,0,.35,1);--display:'Bricolage Grotesque','Plus Jakarta Sans',system-ui,sans-serif;--body:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
.dark{--surface:#131A3A;--raised:#1B2450;--sunken:#0E1430;--ink:#EDF2FB;--muted:#B6C2EE;--faint:#8994C8;--line:#2B3874;--line2:#3C4C92;--primary:#ABC4FF;--primary-h:#C1D3FE;--primary-ink:#ABC4FF;--on-primary:#0E1430;--coral:#F59A78;--coral-h:#F7AB8E;--coral-deep:#F59A78;--coral-soft:rgb(245 154 120 / .16);--on-coral:#0E1430;--pos:#8FC7A5;--pos-soft:rgb(143 199 165 / .14);--on-pos:#0E1430;--danger:#F08AA0;--danger-soft:rgb(240 138 160 / .14);--star:#F59A78;--dot:#2B3874;--brand-bg:#2B3874;--scrim:rgb(5 8 22 / .62);--shadow-1:0 1px 2px rgb(0 0 0 / .3),0 4px 12px -6px rgb(0 0 0 / .4);--shadow-2:0 14px 34px -18px rgb(0 0 0 / .7);--shadow-3:0 34px 80px -30px rgb(0 0 0 / .8);color:var(--ink)}
body{margin:0;font-family:var(--body);color:var(--ink);background:var(--surface);-webkit-font-smoothing:antialiased}
a{color:var(--primary-ink);text-decoration:none}a:hover{color:var(--ink)}
.root{position:relative;overflow:hidden;font-family:var(--body);color:var(--ink);background:var(--surface);font-size:14px;line-height:1.5}
h1,h2,h3,h4{margin:0;font-family:var(--display);font-weight:700;letter-spacing:-.02em;line-height:1.1}
p{margin:0}
.ic{flex:none;display:block}
.star{fill:var(--star);stroke:var(--star)}
.eyebrow{font:700 11px/1.2 var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--faint)}
.muted{color:var(--muted)}.faint{color:var(--faint)}
.container{width:1232px;margin:0 auto}
.row{display:flex;align-items:center}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:999px;font:600 14px/1 var(--body);border:1px solid transparent;white-space:nowrap;cursor:pointer;flex:none}
.btn-sm{height:32px;padding:0 12px;font-size:13px;gap:6px}
.btn-lg{height:52px;padding:0 26px;font-size:16px;gap:10px}
.btn-primary{background:var(--primary);color:var(--on-primary)}
.btn-coral{background:var(--coral);color:var(--on-coral)}
.btn-outline{background:var(--raised);border-color:var(--line2);color:var(--ink)}
.btn-soft{background:var(--sunken);color:var(--ink)}
.btn-ghost{background:transparent;color:var(--muted)}
.btn-danger{background:var(--danger);color:#fff}
.btn-danger-ghost{background:transparent;color:var(--danger)}
.btn-icon{width:40px;padding:0}.btn-icon.btn-sm{width:32px}
.btn-block{width:100%}
.btn[disabled],.btn.is-disabled{opacity:.45}
.chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;font:700 10.5px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.chip-mist{background:var(--sunken);color:var(--ink)}
.chip-raised{background:var(--raised);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line2)}
.chip-navy{background:rgb(14 20 48 / .78);color:#F5F8FE}
.chip-coral{background:var(--coral-soft);color:var(--coral-deep)}
.chip-pos{background:var(--pos);color:var(--on-pos)}
.chip-primary{background:var(--primary);color:var(--on-primary)}
.chip-outline{border:1px solid var(--line2);color:var(--muted)}
.tag{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:var(--sunken);color:var(--ink);font:600 11px/1 var(--body)}
.card{background:var(--raised);border:1px solid var(--line);border-radius:24px}
.input{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:12px;background:var(--surface);border:1px solid var(--line2);font:500 14px/1 var(--body);color:var(--ink);white-space:nowrap;overflow:hidden}
.input.ph{color:var(--faint)}
.input.focus{border-color:var(--primary);box-shadow:0 0 0 3px rgb(79 107 216 / .22)}
.input.error{border-color:var(--danger);box-shadow:0 0 0 3px rgb(184 58 85 / .14)}
.input.disabled{opacity:.55}
.input.readonly{background:var(--sunken);border-style:dashed}
.input.area{height:auto;min-height:96px;align-items:flex-start;padding:12px 14px;white-space:normal;line-height:1.55}
.input .ic{color:var(--faint)}
.select{justify-content:space-between}
.label{display:block;margin-bottom:6px;font:600 12.5px/1.2 var(--body);color:var(--muted)}
.label .req{color:var(--danger)}
.help{margin-top:6px;font-size:12px;color:var(--faint)}
.err{margin-top:6px;font-size:12px;font-weight:600;color:var(--danger);display:flex;gap:6px;align-items:center}
.alert{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;font-size:13.5px;line-height:1.45}
.alert-danger{background:var(--danger-soft);color:var(--danger)}
.alert-pos{background:var(--pos-soft);color:var(--pos)}
.alert-info{background:var(--sunken);color:var(--ink)}
.seg{display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:var(--sunken);border:1px solid var(--line)}
.seg-item{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:999px;font:600 14px/1 var(--body);color:var(--muted);white-space:nowrap}
.seg-item.on{background:var(--raised);color:var(--ink);box-shadow:var(--shadow-1)}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:999px;background:var(--raised);border:1px solid var(--line);font:600 13.5px/1 var(--body);color:var(--muted)}
.pill.on{background:var(--ink);border-color:var(--ink);color:var(--surface)}
.avatar{display:flex;align-items:center;justify-content:center;flex:none;border-radius:999px;background:var(--coral-soft);color:var(--coral-deep);font:700 14px/1 var(--display)}
.dots-bg{background-color:var(--surface);background-image:radial-gradient(var(--dot) 1.3px,transparent 1.5px);background-size:22px 22px}
.scrim{position:absolute;inset:0;background:var(--scrim);backdrop-filter:blur(5px)}
.modal{position:absolute;background:var(--raised);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow-3);overflow:hidden}
.modal-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--line)}
.modal-body{display:flex;flex-direction:column;gap:16px;padding:24px}
.modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--line);background:var(--surface)}
.stars{display:inline-flex;gap:2px}
.stars .off{fill:none;stroke:var(--line2)}
/* Board */
.board{position:relative;overflow:hidden}
.flow{position:absolute;left:0;top:0;transform-origin:0 0}
.edges{position:absolute;left:0;top:0;overflow:visible}
.edges path{fill:none;stroke:var(--primary);stroke-width:2.25}
.edges path.sel{stroke:var(--coral);stroke-width:3}
.node{position:absolute;width:240px;background:var(--raised);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-2)}
.node.sel{border-color:var(--primary);box-shadow:0 0 0 3px rgb(79 107 216 / .3),var(--shadow-2)}
.node.dim{opacity:.35}
.node-img{position:relative;height:135px;border-radius:17px 17px 0 0;overflow:hidden;background:var(--sunken)}
.node-img img,.thumb img,.cover img{width:100%;height:100%;object-fit:cover;display:block}
.node-sched{position:absolute;left:8px;top:8px}
.node-body{padding:10px 14px 12px}
.node-title{font:650 14px/1.3 var(--body);letter-spacing:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node-meta{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:11.5px;color:var(--muted);white-space:nowrap}
.rt{display:inline-flex;align-items:center;gap:3px;font-weight:700;color:var(--ink)}
.node-meta .rt{margin-left:auto}
.node-note{margin-top:8px;font-size:11.5px;line-height:16px;font-style:italic;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.handle{position:absolute;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:var(--primary);border:2px solid var(--raised)}
.handle.l{left:-8px}.handle.r{right:-8px}
.node-tools{position:absolute;left:50%;top:-54px;transform:translateX(-50%);display:flex;gap:2px;padding:4px;background:var(--raised);border:1px solid var(--line);border-radius:999px;box-shadow:var(--shadow-2);white-space:nowrap}
.tool{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;font:600 12.5px/1 var(--body);color:var(--ink)}
.tool.danger{color:var(--danger)}
.epill{position:absolute;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;background:var(--raised);border:1px solid var(--line);font:600 12px/1 var(--body);color:var(--ink);box-shadow:var(--shadow-1);white-space:nowrap}
.epill .dur{color:var(--muted)}
.epill.open{background:var(--coral);border-color:var(--coral);color:var(--on-coral)}
.epill.open .dur{color:var(--on-coral);opacity:.8}
.emenu{position:absolute;transform:translateX(-50%);width:200px;padding:6px;background:var(--raised);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow-3)}
.emenu-item{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border-radius:12px;font:500 13px/1 var(--body);color:var(--ink)}
.emenu-item .t{margin-left:auto;color:var(--muted);font-size:12px}
.emenu-item.on{background:var(--primary);color:var(--on-primary);font-weight:600}
.emenu-item.on .t{color:var(--on-primary);opacity:.85}
.emenu-note{padding:8px 10px 4px;font:700 10px/1.2 var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.emenu-del{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;margin-top:4px;border-top:1px solid var(--line);font:500 13px/1 var(--body);color:var(--danger)}
.fbtn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:999px;background:var(--raised);border:1px solid var(--line);box-shadow:var(--shadow-1);font:600 13px/1 var(--body);color:var(--ink);white-space:nowrap}
.daybar{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:var(--raised);border:1px solid var(--line);box-shadow:var(--shadow-1)}
.day{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:999px;font:600 12px/1 var(--body);color:var(--muted);white-space:nowrap}
.day .n{opacity:.6}
.day.on{background:var(--primary);color:var(--on-primary)}
.controls{position:absolute;right:16px;bottom:16px;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--raised);box-shadow:var(--shadow-1)}
.controls span{display:flex;width:36px;height:36px;align-items:center;justify-content:center;color:var(--ink)}
.controls span+span{border-top:1px solid var(--line)}
.minimap{position:absolute;left:16px;bottom:16px;width:156px;height:100px;border:1px solid var(--line);border-radius:14px;background:var(--raised);overflow:hidden;box-shadow:var(--shadow-1)}
.bhead{display:flex;align-items:center;gap:14px;height:64px;padding:0 20px;background:var(--raised);border-bottom:1px solid var(--line)}
.vdiv{width:1px;height:24px;background:var(--line)}
.side{display:flex;flex-direction:column;background:var(--raised);border-right:1px solid var(--line)}
.srow{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.thumb{width:64px;height:48px;border-radius:10px;overflow:hidden;flex:none;background:var(--sunken)}
.cover{overflow:hidden;background:var(--sunken)}
.clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.clamp3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.trunc{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tabbar{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));height:76px;padding:8px 8px 18px;background:var(--raised);border-top:1px solid var(--line)}
.tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:14px;font:600 11px/1 var(--body);color:var(--muted)}
.tab.on{color:var(--primary-ink)}
.tab.on .tab-ic{background:var(--sunken)}
.tab-ic{display:flex;align-items:center;justify-content:center;width:52px;height:30px;border-radius:999px}
${morphCss}`;

// ---------- Document wrapper ----------
const fontLink = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap';
export const doc = (body, { width, height, dark = false, css = '' }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="${fontLink}">
  <style>${baseCss}${css}</style>
</helmet>
<div class="root${dark ? ' dark' : ''}" style="width: ${width}px; min-height: ${height}px;">
${body}
</div>
</x-dc>
</body>
</html>
`;

// ---------- Primitives ----------
export const brandMark = (size = 32, extraCls = '') => `<span class="brandmark ${extraCls}" style="width: ${size}px; height: ${size}px; border-radius: ${Math.round(size * 0.31)}px;"><svg width="${Math.round(size * 0.62)}" height="${Math.round(size * 0.62)}" viewBox="0 0 24 24" aria-hidden="true"><path class="mp" d="${P.PLANE}"></path></svg></span>`;
export const brand = (size = 32, text = true, fontSize = 20) => `<span class="brand-hover row" style="gap: 10px;">${brandMark(size)}${text ? `<span style="font: 700 ${fontSize}px/1 var(--display); letter-spacing: -0.02em;">TravelPlanner</span>` : ''}</span>`;

export const themeToggle = (checked = false, id = 'tt') => `<label class="tt" aria-label="Switch theme"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="mp core" d="${checked ? P.MOON : P.SUN}"></path><path class="mp rays" d="${P.RAYS}"></path></svg></label>`;

export const heartSvg = (size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path class="mp" d="${P.HEART}"></path></svg>`;
/** Like button. interactive=true makes it a live morph toggle. */
export const likeBtn = (count, { liked = false, size = 'sm', interactive = true } = {}) => {
  const cls = `like${size === 'md' ? ' md' : ''}${liked && !interactive ? ' on' : ''}`;
  if (!interactive) return `<span class="${cls}">${heartSvg(size === 'md' ? 16 : 14)}<span>${fmtNum(count)}</span></span>`;
  return `<label class="${cls}" aria-label="Like this story"><input type="checkbox"${liked ? ' checked' : ''}>${heartSvg(size === 'md' ? 16 : 14)}<span class="n-off">${fmtNum(liked ? count - 1 : count)}</span><span class="n-on">${fmtNum(liked ? count : count + 1)}</span></label>`;
};

export const stars = (rating, size = 14) => `<span class="stars" aria-label="${rating.toFixed(1)} out of 5">${[1, 2, 3, 4, 5].map((s) => icon('star', size, s <= Math.round(rating) ? 'star' : 'off')).join('')}</span>`;
export const rating = (value, size = 12) => `<span class="rt">${icon('star', size, 'star')}${value.toFixed(1)}</span>`;

export const field = (label, control, { help = '', error = '', req = false } = {}) => `<div style="display: flex; flex-direction: column;"><span class="label">${esc(label)}${req ? ' <span class="req">*</span>' : ''}</span>${control}${help ? `<span class="help">${esc(help)}</span>` : ''}${error ? `<span class="err">${icon('alert', 13)}${esc(error)}</span>` : ''}</div>`;
export const input = (value, { ph = false, cls = '', lead = '', trail = '', style = '' } = {}) => `<div class="input ${ph ? 'ph' : ''} ${cls}" style="${style}">${lead}<span class="trunc" style="flex: 1;">${esc(value)}</span>${trail}</div>`;
export const select = (value, opts = {}) => input(value, { ...opts, cls: `select ${opts.cls ?? ''}`, trail: icon('chevron-down', 16) });

export const avatar = (name, size = 36) => `<span class="avatar" style="width: ${size}px; height: ${size}px; font-size: ${Math.round(size * 0.4)}px;">${esc(name.trim().charAt(0).toUpperCase())}</span>`;

export const loader = (size = 40, label = '') => `<div style="display: flex; flex-direction: column; align-items: center; gap: 14px;"><span class="loader" style="display: flex; align-items: center; justify-content: center; width: ${size + 24}px; height: ${size + 24}px; border-radius: 999px; background: var(--raised); border: 1px solid var(--line); box-shadow: var(--shadow-1);"><svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path class="mp" d="${P.DOT}"></path></svg></span>${label ? `<span class="eyebrow" style="color: var(--muted);">${esc(label)}</span>` : ''}</div>`;

export const statusChip = (status) => ({
  upcoming: `<span class="chip chip-raised">Upcoming</span>`,
  active: `<span class="chip chip-pos">Active now</span>`,
  past: `<span class="chip chip-navy">Past</span>`,
}[status]);
export const planChip = (plan) => (plan === 'complete'
  ? `<span class="chip chip-primary">${icon('circle-check', 11)}Complete</span>`
  : `<span class="chip chip-outline" style="background: var(--raised);">${icon('pen-line', 11)}Draft</span>`);
