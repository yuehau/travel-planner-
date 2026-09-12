export type Interest = 'food' | 'culture' | 'nature' | 'nightlife' | 'rest'

export const INTERESTS: Interest[] = ['food', 'culture', 'nature', 'nightlife', 'rest']

export const INTEREST_LABEL: Record<Interest, string> = {
  food: 'Food',
  culture: 'Culture',
  nature: 'Nature',
  nightlife: 'Nightlife',
  rest: 'Rest',
}

export type Pace = 'packed' | 'balanced' | 'slow'

export interface Preferences {
  /** 1 (indifferent) to 5 (loves it) per interest. */
  interests: Record<Interest, number>
  /** Personal ceiling for their share of the whole trip, in MYR. */
  budgetCeiling: number
  pace: Pace
  /** Item ids this member has flagged as must-do. */
  nonNegotiables: string[]
  /** Free text shown to the group: allergies, mobility, anything hard. */
  note?: string
}

export interface Member {
  id: string
  name: string
  tone: string
  preferences: Preferences
}

export type Flexibility = 'locked' | 'movable' | 'droppable'

export interface TripItem {
  id: string
  title: string
  detail: string
  icon: string
  day: number
  /** Minutes from midnight on its day. */
  start: number
  durationMin: number
  /** Total group cost in MYR. */
  cost: number
  prepaid: boolean
  /** Fraction of cost recoverable if dropped, 0 to 1. */
  refundRate: number
  dependsOn: string[]
  flexibility: Flexibility
  interest: Interest
  /** Weather-exposed. Outdoor items are the ones a wet forecast can kill. */
  outdoor: boolean
  /**
   * Latest start still acceptable, in minutes from midnight.
   * Present for items with a window (a hotel check-in desk open until 22:00).
   */
  windowEnd?: number
  /**
   * The hours this item makes any sense at all, in minutes from midnight.
   *
   * Without this, a free dry slot is indistinguishable from a sensible one, and
   * the repair engine will cheerfully offer you a night market at 08:00 or a
   * forest trek at 22:00. Opening hours and daylight are real constraints.
   */
  sensibleHours?: { earliest: number; latest: number }
}

export interface Trip {
  id: string
  destination: string
  /** ISO date (YYYY-MM-DD) of day 1, so day N maps to a real calendar date. */
  startDate: string
  /** Coordinates of the destination, used for the weather forecast. */
  lat: number
  lon: number
  nights: number
  /** Group budget in MYR. */
  budget: number
  members: Member[]
  items: TripItem[]
}

/**
 * Something that has gone wrong with one item. The cascade engine propagates
 * these through the dependency graph.
 *
 * `delay` pushes an item later and everything downstream with it.
 * `unavailable` takes an item out entirely — a rained-off hike, a closed
 * attraction, a cancelled ferry — and breaks whatever depended on it.
 */
export type Impairment =
  | { kind: 'delay'; itemId: string; minutes: number; reason: string }
  | { kind: 'unavailable'; itemId: string; reason: string }

export type ItemStatus = 'safe' | 'shifted' | 'broken'

export interface ItemOutcome {
  itemId: string
  status: ItemStatus
  /** Earliest the item could now begin, minutes from midnight. */
  earliestStart: number
  /** Minutes later than originally planned. */
  delayMin: number
  reason: string
}

export interface Cascade {
  impairments: Impairment[]
  outcomes: ItemOutcome[]
  brokenIds: string[]
  shiftedIds: string[]
  safeIds: string[]
  /** Money already spent on items that are now broken. */
  atRisk: number
}

export type RepairAction =
  | { kind: 'keep'; itemId: string }
  | { kind: 'move'; itemId: string; toDay: number; toStart: number }
  | { kind: 'drop'; itemId: string }

export interface MemberImpact {
  memberId: string
  /** Change in how well the plan serves them, as a percentage of their ideal. */
  fitDelta: number
  /** Their share of the new total, MYR. */
  share: number
  /** True when share exceeds their stated ceiling. */
  overCeiling: boolean
  /** Non-negotiable item ids this option sacrifices. */
  sacrificed: string[]
}

export interface RepairOption {
  id: string
  /** Short, human label: Preserve, Cheapest, Rest. */
  name: string
  strategy: string
  actions: RepairAction[]
  costDelta: number
  impacts: MemberImpact[]
  /** One sentence a person would actually say. Rendered verbatim. */
  rationale: string
  /** The binding constraint, if any. */
  bindingConstraint?: string
}

export interface RepairResult {
  options: RepairOption[]
  /** Which engine produced this: the live model or the offline fallback. */
  source: 'claude' | 'local'
}
