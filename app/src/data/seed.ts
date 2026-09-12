import type { Trip } from '../types'
import { findDestination } from './destinations'

/** Minutes from midnight, from a "HH:MM" string. */
export const t = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minutes from midnight back to "HH:MM". */
export const hhmm = (mins: number): string => {
  const wrapped = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * The next Saturday, as an ISO date.
 *
 * The demo trip has to sit inside the weather forecast window or there is
 * nothing to forecast, so the date is computed rather than hard-coded. It also
 * means the demo never goes stale.
 */
export function nextSaturday(from = new Date()): string {
  const d = new Date(from)
  const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntilSaturday)
  return d.toISOString().slice(0, 10)
}

/** Add whole days to an ISO date string. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Day 1 is the trip's start date, so day N is startDate + (N-1). */
export const dateForDay = (trip: Pick<Trip, 'startDate'>, day: number): string =>
  addDays(trip.startDate, day - 1)

const CAMERONS = findDestination('cameron-highlands')!

/**
 * Four friends from KL, a weekend in Cameron Highlands.
 *
 * This is what a local trip actually looks like: you drive, you do not fly;
 * the spend is a few hundred ringgit, not a few thousand; and almost everything
 * worth going for happens outdoors in a place where it rains most afternoons.
 *
 * Costs here are illustrative, for the demo. In the real app every figure is
 * entered by the people on the trip — the app never invents a price.
 */
export const SEED_TRIP: Trip = {
  id: 'trip-camerons',
  destination: `${CAMERONS.name}, ${CAMERONS.state}`,
  startDate: nextSaturday(),
  lat: CAMERONS.lat,
  lon: CAMERONS.lon,
  nights: 2,
  budget: 2000,

  members: [
    {
      id: 'ali',
      name: 'Ali',
      tone: '#0f766e',
      preferences: {
        interests: { food: 5, culture: 3, nature: 3, nightlife: 3, rest: 2 },
        budgetCeiling: 600,
        pace: 'balanced',
        nonNegotiables: ['night-market'],
        note: 'I am only here for the night market. Everything else is negotiable.',
      },
    },
    {
      id: 'sarah',
      name: 'Sarah',
      tone: '#b45309',
      preferences: {
        interests: { food: 3, culture: 4, nature: 3, nightlife: 1, rest: 5 },
        budgetCeiling: 420,
        pace: 'slow',
        nonNegotiables: [],
        note: 'Payday is next week. Please keep my share under RM420.',
      },
    },
    {
      id: 'mei',
      name: 'Mei',
      tone: '#7c3aed',
      preferences: {
        interests: { food: 3, culture: 2, nature: 5, nightlife: 3, rest: 1 },
        budgetCeiling: 850,
        pace: 'packed',
        nonNegotiables: ['mossy-forest'],
        note: 'Booked the guided trek months ago. This is the whole reason I came.',
      },
    },
    {
      id: 'danish',
      name: 'Danish',
      tone: '#0369a1',
      preferences: {
        interests: { food: 4, culture: 3, nature: 3, nightlife: 2, rest: 5 },
        budgetCeiling: 620,
        pace: 'slow',
        nonNegotiables: [],
        note: 'Driving up, so I would rather not be out late on Saturday.',
      },
    },
  ],

  items: [
    // ---- Day 1 · Saturday ----
    {
      id: 'drive-up',
      title: 'Drive up from KL',
      detail: `${CAMERONS.driveHoursFromKL}h via Simpang Pulai · petrol and tolls split`,
      icon: '🚗',
      day: 1,
      start: t('06:30'),
      durationMin: 210,
      cost: 180,
      prepaid: false,
      refundRate: 0,
      dependsOn: [],
      flexibility: 'locked',
      interest: 'rest',
      outdoor: false,
    },
    {
      id: 'brunch',
      title: 'Brunch in Tanah Rata',
      detail: 'Whatever is open when we get in',
      icon: '☕',
      day: 1,
      start: t('10:30'),
      durationMin: 60,
      cost: 80,
      prepaid: false,
      refundRate: 1,
      dependsOn: ['drive-up'],
      flexibility: 'droppable',
      interest: 'food',
      outdoor: false,
      sensibleHours: { earliest: t('08:00'), latest: t('11:30') },
    },
    {
      id: 'checkin',
      title: 'Guesthouse check-in',
      detail: 'Reception open until 21:00 · 2 nights, 2 rooms',
      icon: '🏡',
      day: 1,
      start: t('12:00'),
      durationMin: 30,
      cost: 540,
      prepaid: true,
      refundRate: 0,
      dependsOn: ['drive-up'],
      flexibility: 'movable',
      interest: 'rest',
      outdoor: false,
      windowEnd: t('21:00'),
    },
    {
      id: 'mossy-forest',
      title: 'Mossy Forest guided trek',
      detail: 'Prepaid, non-refundable · Mei’s must-do',
      icon: '🌲',
      day: 1,
      start: t('14:00'),
      durationMin: 150,
      cost: 320,
      prepaid: true,
      refundRate: 0,
      dependsOn: ['checkin'],
      flexibility: 'movable',
      interest: 'nature',
      outdoor: true,
      sensibleHours: { earliest: t('07:00'), latest: t('15:00') },
    },
    {
      id: 'tea-plantation',
      title: 'BOH tea plantation',
      detail: 'Hillside café and the terraces walk',
      icon: '🍃',
      day: 1,
      start: t('17:00'),
      durationMin: 120,
      cost: 60,
      prepaid: false,
      refundRate: 1,
      dependsOn: ['checkin'],
      flexibility: 'movable',
      interest: 'nature',
      outdoor: true,
      sensibleHours: { earliest: t('09:00'), latest: t('16:30') },
    },
    {
      id: 'night-market',
      title: 'Brinchang night market',
      detail: 'Open-air stalls · Ali’s must-do',
      icon: '🏮',
      day: 1,
      start: t('19:30'),
      durationMin: 90,
      cost: 120,
      prepaid: false,
      refundRate: 1,
      dependsOn: ['checkin'],
      flexibility: 'movable',
      interest: 'food',
      outdoor: true,
      sensibleHours: { earliest: t('18:00'), latest: t('21:00') },
    },

    // ---- Day 2 · Sunday · deliberately light, so a repair has somewhere to go ----
    {
      id: 'strawberry-farm',
      title: 'Strawberry farm',
      detail: 'Pick your own, then the scones',
      icon: '🍓',
      day: 2,
      start: t('10:00'),
      durationMin: 75,
      cost: 90,
      prepaid: false,
      refundRate: 1,
      dependsOn: [],
      flexibility: 'droppable',
      interest: 'nature',
      outdoor: true,
      sensibleHours: { earliest: t('08:30'), latest: t('16:00') },
    },
    {
      id: 'lunch',
      title: 'Steamboat lunch',
      detail: 'Indoors, and very much the point',
      icon: '🍲',
      day: 2,
      start: t('12:30'),
      durationMin: 60,
      cost: 100,
      prepaid: false,
      refundRate: 1,
      dependsOn: [],
      flexibility: 'movable',
      interest: 'food',
      outdoor: false,
      sensibleHours: { earliest: t('11:30'), latest: t('14:30') },
    },
    {
      id: 'drive-home',
      title: 'Drive back to KL',
      detail: 'Monday morning, before the jam',
      icon: '🛣️',
      day: 3,
      start: t('11:00'),
      durationMin: 210,
      cost: 180,
      prepaid: false,
      refundRate: 0,
      dependsOn: [],
      flexibility: 'locked',
      interest: 'rest',
      outdoor: false,
    },
  ],
}
