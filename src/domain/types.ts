export type MemberId = string
export type Pace = 'relaxed' | 'packed'
export type StopCategory = 'food' | 'sight' | 'nature' | 'cafe' | 'market'
export type LensId = 'categories' | 'itinerary' | 'people'

export interface Trip {
  id: string
  destination: string
  startDate: string
  days: number
  currency: string
  budgetPerPerson: number
}

export interface Member {
  id: MemberId
  name: string
  color: string
  budgetCap: number
  pace: Pace
  must: string[]
  avoid: string[]
}

export interface Stop {
  id: string
  day: number
  order: number
  name: string
  start: string
  durationMin: number
  costPerPerson: number
  lat: number
  lng: number
  category: StopCategory
  serves: MemberId[]
  conflicts: MemberId[]
  reason: string
}

export interface Booking {
  id: string
  type: 'flight' | 'stay'
  title: string
  ref: string
  start: string
  end: string
  cost: number
  affectsDay: number
}

export interface Expense {
  id: string
  sourceId: string
  paidBy: MemberId
  amount: number
  splitAmong: MemberId[]
}

export interface TripState {
  trip: Trip
  members: Member[]
  stops: Stop[]
  bookings: Booking[]
  expenses: Expense[]
}
