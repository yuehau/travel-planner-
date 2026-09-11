import type { Trip } from '../types'

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
 * Four friends, three nights in Penang.
 *
 * The Day 1 chain is the point: flight -> transfer -> check-in -> cooking class
 * -> dinner. Each edge is a real dependency, so a delay at the top has
 * consequences the app can compute rather than guess.
 */
export const SEED_TRIP: Trip = {
  id: 'trip-penang',
  destination: 'Penang, Malaysia',
  nights: 3,
  budget: 2400,

  members: [
    {
      id: 'ali',
      name: 'Ali',
      tone: '#0f766e',
      preferences: {
        interests: { food: 5, culture: 4, nature: 2, nightlife: 2, rest: 2 },
        budgetCeiling: 620,
        pace: 'balanced',
        nonNegotiables: ['cooking-class'],
        note: 'Booked this trip around the cooking class. Please protect it.',
      },
    },
    {
      id: 'sarah',
      name: 'Sarah',
      tone: '#b45309',
      preferences: {
        interests: { food: 3, culture: 5, nature: 3, nightlife: 1, rest: 4 },
        budgetCeiling: 430,
        pace: 'slow',
        nonNegotiables: [],
        note: 'Tight budget this month. I would rather skip things than overspend.',
      },
    },
    {
      id: 'mei',
      name: 'Mei',
      tone: '#7c3aed',
      preferences: {
        interests: { food: 4, culture: 2, nature: 5, nightlife: 5, rest: 1 },
        budgetCeiling: 900,
        pace: 'packed',
        nonNegotiables: ['penang-hill'],
      },
    },
    {
      id: 'danish',
      name: 'Danish',
      tone: '#0369a1',
      preferences: {
        interests: { food: 4, culture: 3, nature: 3, nightlife: 2, rest: 5 },
        budgetCeiling: 640,
        pace: 'slow',
        nonNegotiables: [],
        note: 'Shellfish allergy — anywhere we eat needs an option for me.',
      },
    },
  ],

  items: [
    // ---- Day 1 · the chain that breaks ----
    {
      id: 'flight-in',
      title: 'Flight AK6023 arrives',
      detail: 'Kuala Lumpur → Penang',
      icon: '✈️',
      day: 1,
      start: t('14:00'),
      durationMin: 0,
      cost: 0,
      prepaid: true,
      refundRate: 0,
      dependsOn: [],
      flexibility: 'locked',
      interest: 'rest',
    },
    {
      id: 'transfer',
      title: 'Airport transfer',
      detail: 'Pre-booked van, 4 seats',
      icon: '🚕',
      day: 1,
      start: t('14:30'),
      durationMin: 45,
      cost: 80,
      prepaid: false,
      refundRate: 1,
      dependsOn: ['flight-in'],
      flexibility: 'movable',
      interest: 'rest',
    },
    {
      id: 'checkin',
      title: 'Hotel check-in',
      detail: 'Desk open until 22:00',
      icon: '🏨',
      day: 1,
      start: t('15:00'),
      durationMin: 30,
      cost: 780,
      prepaid: true,
      refundRate: 0,
      dependsOn: ['transfer'],
      flexibility: 'movable',
      interest: 'rest',
      windowEnd: t('22:00'),
    },
    {
      id: 'cooking-class',
      title: 'Nyonya cooking class',
      detail: 'Prepaid, non-refundable · Ali’s must-do',
      icon: '🍜',
      day: 1,
      start: t('16:00'),
      durationMin: 150,
      cost: 260,
      prepaid: true,
      refundRate: 0,
      dependsOn: ['checkin'],
      flexibility: 'movable',
      interest: 'food',
    },
    {
      id: 'dinner',
      title: 'Dinner at Kebaya',
      detail: 'Table for 4 · free cancellation',
      icon: '🍽️',
      day: 1,
      start: t('19:30'),
      durationMin: 90,
      cost: 180,
      prepaid: false,
      refundRate: 1,
      dependsOn: ['checkin'],
      flexibility: 'droppable',
      interest: 'food',
    },

    // ---- Day 2 ----
    {
      id: 'heritage-walk',
      title: 'George Town heritage walk',
      detail: 'Guided, 3 hours',
      icon: '🏛️',
      day: 2,
      start: t('10:00'),
      durationMin: 180,
      cost: 120,
      prepaid: false,
      refundRate: 1,
      dependsOn: [],
      flexibility: 'movable',
      interest: 'culture',
    },
    {
      id: 'penang-hill',
      title: 'Penang Hill funicular',
      detail: 'Sunset slot · Mei’s must-do',
      icon: '⛰️',
      day: 2,
      start: t('16:00'),
      durationMin: 210,
      cost: 160,
      prepaid: false,
      refundRate: 1,
      dependsOn: [],
      flexibility: 'movable',
      interest: 'nature',
    },

    // ---- Day 3 ----
    {
      id: 'street-food',
      title: 'Gurney Drive food crawl',
      detail: 'Self-guided',
      icon: '🥘',
      day: 3,
      start: t('11:00'),
      durationMin: 180,
      cost: 140,
      prepaid: false,
      refundRate: 1,
      dependsOn: [],
      flexibility: 'droppable',
      interest: 'food',
    },
    {
      id: 'flight-out',
      title: 'Flight AK6030 departs',
      detail: 'Penang → Kuala Lumpur',
      icon: '🛫',
      day: 3,
      start: t('18:00'),
      durationMin: 0,
      cost: 0,
      prepaid: true,
      refundRate: 0,
      dependsOn: [],
      flexibility: 'locked',
      interest: 'rest',
    },
  ],
}

/** The disruption the demo injects: the inbound flight slips to 19:30. */
export const DISRUPTION = {
  itemId: 'flight-in',
  label: 'Flight AK6023 delayed',
  detail: 'Now arriving 19:30 instead of 14:00',
  delayMin: 330,
}
