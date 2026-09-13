import type { MalaysiaStateId } from './attractions';

export type PlanTier = 'budget' | 'balanced' | 'premium';

export type TripPlan = {
  id: string;
  state: MalaysiaStateId;
  tier: PlanTier;
  label: string;
  name: string;
  description: string;
  attractionIds: string[];
};

export const tierLabels: Record<PlanTier, string> = {
  budget: 'Budget',
  balanced: 'Balanced',
  premium: 'Premium',
};

export const tripPlans: TripPlan[] = [
  {
    id: 'penang-plan-a',
    state: 'penang',
    tier: 'budget',
    label: 'Plan A',
    name: 'Heritage & Hawker',
    description: 'Free street art, temples, and hawker food - the cheapest way to see Penang well.',
    attractionIds: ['penang-street-art', 'penang-clan-jetties', 'penang-chew-jetty', 'penang-kek-lok-si', 'penang-gurney-drive'],
  },
  {
    id: 'penang-plan-b',
    state: 'penang',
    tier: 'balanced',
    label: 'Plan B',
    name: 'Best of Penang',
    description: 'Adds the hilltop views and mansion tour on top of the budget highlights.',
    attractionIds: [
      'penang-street-art',
      'penang-clan-jetties',
      'penang-kek-lok-si',
      'penang-gurney-drive',
      'penang-peranakan-mansion',
      'penang-hill',
      'penang-spice-garden',
    ],
  },
  {
    id: 'penang-plan-c',
    state: 'penang',
    tier: 'premium',
    label: 'Plan C',
    name: 'Full Penang Explorer',
    description: 'Everything in Balanced plus a full day at Escape Theme Park and the beach.',
    attractionIds: [
      'penang-street-art',
      'penang-clan-jetties',
      'penang-kek-lok-si',
      'penang-gurney-drive',
      'penang-peranakan-mansion',
      'penang-hill',
      'penang-spice-garden',
      'penang-escape-park',
      'penang-batu-ferringhi',
    ],
  },
  {
    id: 'melaka-plan-a',
    state: 'melaka',
    tier: 'budget',
    label: 'Plan A',
    name: 'Old Town Highlights',
    description: 'The free landmarks around Dutch Square plus the Jonker Street night market.',
    attractionIds: ['melaka-a-famosa', 'melaka-christ-church', 'melaka-straits-mosque', 'melaka-kampung-morten', 'melaka-jonker-street'],
  },
  {
    id: 'melaka-plan-b',
    state: 'melaka',
    tier: 'balanced',
    label: 'Plan B',
    name: 'Melaka Explorer',
    description: 'Adds the river cruise, the Baba Nyonya museum, and the gyro tower view.',
    attractionIds: [
      'melaka-a-famosa',
      'melaka-christ-church',
      'melaka-straits-mosque',
      'melaka-jonker-street',
      'melaka-river-cruise',
      'melaka-baba-nyonya-museum',
      'melaka-menara-taming-sari',
    ],
  },
  {
    id: 'melaka-plan-c',
    state: 'melaka',
    tier: 'premium',
    label: 'Plan C',
    name: 'Full Melaka Experience',
    description: 'Everything in Balanced plus the big-stage Encore Melaka show and mall time.',
    attractionIds: [
      'melaka-a-famosa',
      'melaka-christ-church',
      'melaka-straits-mosque',
      'melaka-jonker-street',
      'melaka-river-cruise',
      'melaka-baba-nyonya-museum',
      'melaka-menara-taming-sari',
      'melaka-dataran-pahlawan',
      'melaka-encore-show',
    ],
  },
];

export const getPlansByState = (state: MalaysiaStateId): TripPlan[] => tripPlans.filter((plan) => plan.state === state);
