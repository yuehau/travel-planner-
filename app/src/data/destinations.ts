/**
 * Malaysian destinations locals actually go to, with coordinates for the
 * weather forecast.
 *
 * ⚠️ VERIFY THESE COORDINATES before the pitch. They come from general
 * knowledge, not a geocoding service. A pin that is off by a valley gives you
 * the wrong forecast, and a wrong forecast is worse than no forecast. Two
 * minutes each in Google Maps is enough.
 *
 * `driveHoursFromKL` is a rough planning figure, not a routing result. Real
 * travel time depends on traffic, and on a holiday weekend the North–South
 * Expressway makes a mockery of all of these.
 */
export interface Destination {
  id: string
  name: string
  state: string
  lat: number
  lon: number
  driveHoursFromKL: number
  /** What people go there for — drives the default item suggestions. */
  known: string
  /** How exposed a typical trip here is to weather, 1–5. */
  weatherExposure: number
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'cameron-highlands',
    name: 'Cameron Highlands',
    state: 'Pahang',
    lat: 4.47,
    lon: 101.38,
    driveHoursFromKL: 3.5,
    known: 'Tea plantations, mossy forest, strawberry farms, cool weather',
    weatherExposure: 5,
  },
  {
    id: 'penang',
    name: 'Penang',
    state: 'Penang',
    lat: 5.4164,
    lon: 100.3327,
    driveHoursFromKL: 4,
    known: 'Street food, George Town heritage, Penang Hill',
    weatherExposure: 3,
  },
  {
    id: 'melaka',
    name: 'Melaka',
    state: 'Melaka',
    lat: 2.1896,
    lon: 102.2501,
    driveHoursFromKL: 2,
    known: 'Jonker Street, heritage buildings, river cruise',
    weatherExposure: 3,
  },
  {
    id: 'ipoh',
    name: 'Ipoh',
    state: 'Perak',
    lat: 4.5975,
    lon: 101.0901,
    driveHoursFromKL: 2.5,
    known: 'Old town cafés, cave temples, hot springs',
    weatherExposure: 2,
  },
  {
    id: 'langkawi',
    name: 'Langkawi',
    state: 'Kedah',
    lat: 6.35,
    lon: 99.8,
    driveHoursFromKL: 6,
    known: 'Beaches, cable car, island hopping',
    weatherExposure: 5,
  },
  {
    id: 'port-dickson',
    name: 'Port Dickson',
    state: 'Negeri Sembilan',
    lat: 2.5228,
    lon: 101.7959,
    driveHoursFromKL: 1.5,
    known: 'Closest beach to KL, day-trip territory',
    weatherExposure: 4,
  },
  {
    id: 'janda-baik',
    name: 'Janda Baik',
    state: 'Pahang',
    lat: 3.3333,
    lon: 101.85,
    driveHoursFromKL: 1,
    known: 'River chalets, weekend escape, very close to KL',
    weatherExposure: 4,
  },
  {
    id: 'taman-negara',
    name: 'Taman Negara',
    state: 'Pahang',
    lat: 4.3833,
    lon: 102.4,
    driveHoursFromKL: 3.5,
    known: 'Rainforest, canopy walkway, river trips',
    weatherExposure: 5,
  },
  {
    id: 'kundasang',
    name: 'Kundasang',
    state: 'Sabah',
    lat: 6.0167,
    lon: 116.5667,
    driveHoursFromKL: -1,
    known: 'Kinabalu views, dairy farm, cool highland air',
    weatherExposure: 5,
  },
  {
    id: 'kota-kinabalu',
    name: 'Kota Kinabalu',
    state: 'Sabah',
    lat: 5.9804,
    lon: 116.0735,
    driveHoursFromKL: -1,
    known: 'Islands, sunsets, seafood',
    weatherExposure: 4,
  },
  {
    id: 'tioman',
    name: 'Tioman',
    state: 'Pahang',
    lat: 2.7833,
    lon: 104.1667,
    driveHoursFromKL: 4.5,
    known: 'Diving, beaches — ferry-dependent',
    weatherExposure: 5,
  },
  {
    id: 'kuala-selangor',
    name: 'Kuala Selangor',
    state: 'Selangor',
    lat: 3.3406,
    lon: 101.2494,
    driveHoursFromKL: 1,
    known: 'Fireflies, seafood, easy day trip',
    weatherExposure: 4,
  },
]

/** `-1` drive hours means you fly — Sabah and Sarawak are not a road trip from KL. */
export const isFlyOnly = (d: Destination): boolean => d.driveHoursFromKL < 0

export const findDestination = (id: string): Destination | undefined =>
  DESTINATIONS.find((d) => d.id === id)
