import type { TripState } from '../domain/types'

export const seed: TripState = {
  trip: {
    id: 'penang-2026',
    destination: 'Penang',
    startDate: '2026-10-02',
    days: 3,
    currency: 'MYR',
    budgetPerPerson: 450,
  },
  members: [
    { id: 'm1', name: 'Yap', color: '#3B82F6', budgetCap: 500, pace: 'relaxed', must: ['street food'], avoid: ['hiking'] },
    { id: 'm2', name: 'Wei', color: '#F59E0B', budgetCap: 300, pace: 'packed', must: ['photo spots'], avoid: [] },
    { id: 'm3', name: 'Mei', color: '#10B981', budgetCap: 600, pace: 'relaxed', must: ['cafes'], avoid: ['seafood'] },
    { id: 'm4', name: 'Ali', color: '#8B5CF6', budgetCap: 400, pace: 'packed', must: [], avoid: ['pork'] },
  ],
  stops: [
    {
      id: 's1', day: 1, order: 1, name: 'Chew Jetty', start: '16:00', durationMin: 75,
      costPerPerson: 0, lat: 5.4141, lng: 100.3416, category: 'sight',
      serves: ['m2'], conflicts: ['m3'],
      reason: 'Wei gets the stilt houses in late afternoon light. There is nowhere to sit down for coffee out here, which is what Mei asked for.',
    },
    {
      id: 's2', day: 1, order: 2, name: 'Armenian Street murals', start: '17:45', durationMin: 60,
      costPerPerson: 0, lat: 5.4171, lng: 100.3380, category: 'sight',
      serves: ['m2', 'm3'], conflicts: ['m4'],
      reason: 'The murals are Wei’s shot and the coffee shops along the street cover Mei. It is a slow wander, and Ali would rather keep moving.',
    },
    {
      id: 's3', day: 1, order: 3, name: 'Chulia Street night market', start: '19:30', durationMin: 90,
      costPerPerson: 25, lat: 5.4183, lng: 100.3355, category: 'market',
      serves: ['m1', 'm2'], conflicts: ['m4'],
      reason: 'Covers Yap’s street food and Wei’s photo spots. Ali avoids pork, so his options here are limited.',
    },
    {
      id: 's4', day: 1, order: 4, name: 'Gurney Drive hawker centre', start: '21:30', durationMin: 75,
      costPerPerson: 30, lat: 5.4372, lng: 100.3095, category: 'food',
      serves: ['m1', 'm4'], conflicts: ['m3'],
      reason: 'More street food for Yap, and the halal stalls here work for Ali. Most of what Gurney is famous for is seafood, which Mei avoids.',
    },
    {
      id: 's5', day: 2, order: 1, name: 'Line Clear Nasi Kandar', start: '08:30', durationMin: 45,
      costPerPerson: 15, lat: 5.4189, lng: 100.3320, category: 'food',
      serves: ['m1'], conflicts: ['m3'],
      reason: 'Yap’s pick, and the best nasi kandar on the island. It is a standing-room alley, not the slow breakfast Mei wanted to start with.',
    },
    {
      id: 's6', day: 2, order: 2, name: 'Kek Lok Si Temple', start: '10:00', durationMin: 120,
      costPerPerson: 12, lat: 5.3993, lng: 100.2735, category: 'sight',
      serves: ['m2', 'm4'], conflicts: ['m1'],
      reason: 'The pagoda tiers are the best frame Wei will get all trip, and the pace suits Ali. Getting up there is a long climb, and Yap avoids hiking.',
    },
    {
      id: 's7', day: 2, order: 3, name: 'Penang Hill funicular', start: '13:00', durationMin: 150,
      costPerPerson: 30, lat: 5.4239, lng: 100.2686, category: 'nature',
      serves: ['m2', 'm4'], conflicts: ['m1', 'm3'],
      reason: 'Wei gets the island panorama and Ali gets a full afternoon. There is a lot of walking at the top for Yap, and it takes the whole afternoon Mei had earmarked for cafes.',
    },
    {
      id: 's8', day: 2, order: 4, name: 'China House', start: '16:30', durationMin: 90,
      costPerPerson: 35, lat: 5.4157, lng: 100.3400, category: 'cafe',
      serves: ['m3', 'm1'], conflicts: ['m2'],
      reason: 'Mei’s cafe stop, and the cake counter is worth the detour for Yap too. It runs through the last of the good light, so Wei shoots nothing.',
    },
    {
      id: 's9', day: 3, order: 1, name: 'Batu Ferringhi beach', start: '09:30', durationMin: 120,
      costPerPerson: 0, lat: 5.4750, lng: 100.2500, category: 'nature',
      serves: ['m3', 'm2'], conflicts: ['m4'],
      reason: 'A slow morning for Mei with the coastline for Wei. It is a soft start to the day, and Ali would rather have packed something in.',
    },
    {
      id: 's10', day: 3, order: 2, name: 'Tropical Spice Garden', start: '12:00', durationMin: 90,
      costPerPerson: 28, lat: 5.4620, lng: 100.2450, category: 'nature',
      serves: ['m3', 'm4'], conflicts: ['m1'],
      reason: 'Shaded garden trails suit Mei, and it gives Ali a real stop rather than a photo pause. The trails climb, which Yap avoids.',
    },
    {
      id: 's11', day: 3, order: 3, name: 'Kimberley Street food street', start: '18:30', durationMin: 90,
      costPerPerson: 22, lat: 5.4166, lng: 100.3345, category: 'market',
      serves: ['m1', 'm4'], conflicts: ['m2'],
      reason: 'Yap’s last street food run, with enough non-pork stalls to keep Ali fed. It is dark and cramped, so there is little here for Wei to shoot.',
    },
  ],
  bookings: [
    {
      id: 'b1', type: 'flight', title: 'MH1234 KUL to PEN', ref: 'MH1234',
      start: '2026-10-02T12:30:00', end: '2026-10-02T13:35:00', cost: 180, affectsDay: 1,
    },
    {
      id: 'b2', type: 'stay', title: 'Chulia Heritage Hotel', ref: 'CHH-88421',
      start: '2026-10-02T15:00:00', end: '2026-10-05T12:00:00', cost: 260, affectsDay: 1,
    },
    {
      id: 'b3', type: 'flight', title: 'MH1247 PEN to KUL', ref: 'MH1247',
      start: '2026-10-05T14:10:00', end: '2026-10-05T15:15:00', cost: 180, affectsDay: 3,
    },
  ],
  expenses: [
    { id: 'e1', sourceId: 'b2', paidBy: 'm2', amount: 1040, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
    { id: 'e2', sourceId: 's4', paidBy: 'm1', amount: 120, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
    { id: 'e3', sourceId: 's7', paidBy: 'm3', amount: 120, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
  ],
}
