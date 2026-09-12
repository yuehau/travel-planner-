import type { Member, Preferences, Trip, TripItem } from '../types'

/**
 * Storage lives behind this interface for one reason: the demo must never be a
 * failed network call away from a blank screen.
 *
 * The local adapter is real persistence, not a stub — trips you create survive
 * a reload. The Supabase adapter is the same contract against a real database
 * with real accounts. Which one runs is decided once, at startup, by whether
 * the Supabase env vars are present.
 */

export interface TripSummary {
  id: string
  destination: string
  startDate: string
  nights: number
  memberCount: number
  itemCount: number
}

export interface NewTrip {
  destinationId: string
  destination: string
  lat: number
  lon: number
  startDate: string
  nights: number
  budget: number
}

export interface TripRepo {
  /** Which backend is actually serving this session. Surfaced in the UI. */
  readonly mode: 'local' | 'supabase'
  /** Human-readable note about the mode, for the footer. */
  readonly note: string

  listTrips(): Promise<TripSummary[]>
  getTrip(id: string): Promise<Trip | null>
  createTrip(input: NewTrip): Promise<Trip>
  deleteTrip(id: string): Promise<void>

  upsertItem(tripId: string, item: TripItem): Promise<void>
  deleteItem(tripId: string, itemId: string): Promise<void>

  upsertMember(tripId: string, member: Member): Promise<void>
  removeMember(tripId: string, memberId: string): Promise<void>
  setPreferences(tripId: string, memberId: string, prefs: Preferences): Promise<void>

  /** Returns the trip id joined. */
  joinTrip(code: string): Promise<string>
  /** The code someone else would use to join. */
  inviteCode(tripId: string): Promise<string | null>
}

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** True when a real backend is configured. */
export const hasSupabase = Boolean(URL && KEY)

let cached: TripRepo | undefined

/**
 * Resolve the repository once per session.
 *
 * Deliberately falls back rather than throwing: a missing key, a paused
 * project or a dead network all end up in local mode with the app still
 * usable, which is the right behaviour five minutes before a pitch.
 */
export async function getRepo(): Promise<TripRepo> {
  if (cached) return cached

  if (hasSupabase) {
    try {
      const { createSupabaseRepo } = await import('./repoSupabase')
      cached = await createSupabaseRepo(URL!, KEY!)
      return cached
    } catch (err) {
      console.warn('[repo] Supabase unavailable, falling back to local storage:', err)
    }
  }

  const { createLocalRepo } = await import('./repoLocal')
  cached = createLocalRepo()
  return cached
}

/** Only for tests and for switching modes in development. */
export function resetRepo(): void {
  cached = undefined
}
