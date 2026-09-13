import type { Member, Preferences, Trip, TripItem } from '../types'
import { SEED_TRIP } from './seed'
import type { NewTrip, TripRepo, TripSummary } from './repo'

/**
 * Real persistence in the browser. Not a stub — a trip you create here survives
 * a reload, a restart and a flat battery.
 *
 * What it is not: shared. Everything lives in this one browser, so it cannot
 * back the group flow. That is what the Supabase adapter is for. Until then
 * this makes the app genuinely usable by one person, which is most of the
 * product and all of the demo.
 */

const KEY = 'detour.trips.v1'

interface Store {
  trips: Record<string, Trip>
  codes: Record<string, string>
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Store
      if (parsed && typeof parsed === 'object' && parsed.trips) return parsed
    }
  } catch (err) {
    // Private windows, cleared site data, quota — none of it should be fatal.
    console.warn('[repoLocal] could not read stored trips:', err)
  }
  // First run: the demo trip is there so the app is never empty on open.
  return { trips: { [SEED_TRIP.id]: SEED_TRIP }, codes: { [SEED_TRIP.id]: 'CAMERONS' } }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch (err) {
    console.warn('[repoLocal] could not save; changes are in memory only:', err)
  }
}

const randomCode = () =>
  Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

export function createLocalRepo(): TripRepo {
  let store = read()

  const commit = () => { write(store) }

  return {
    mode: 'local',
    note: 'Saved in this browser only — no account, not shared with anyone else.',

    async listTrips(): Promise<TripSummary[]> {
      return Object.values(store.trips)
        .map((t) => ({
          id: t.id,
          destination: t.destination,
          startDate: t.startDate,
          nights: t.nights,
          memberCount: t.members.length,
          itemCount: t.items.length,
        }))
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    },

    async getTrip(id: string): Promise<Trip | null> {
      return store.trips[id] ?? null
    },

    async createTrip(input: NewTrip): Promise<Trip> {
      const id = `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      const trip: Trip = {
        id,
        destination: input.destination,
        startDate: input.startDate,
        lat: input.lat,
        lon: input.lon,
        nights: input.nights,
        budget: input.budget,
        members: [],
        items: [],
      }
      store.trips[id] = trip
      store.codes[id] = randomCode()
      commit()
      return trip
    },

    async deleteTrip(id: string): Promise<void> {
      delete store.trips[id]
      delete store.codes[id]
      commit()
    },

    async upsertItem(tripId: string, item: TripItem): Promise<void> {
      const trip = store.trips[tripId]
      if (!trip) return
      const i = trip.items.findIndex((x) => x.id === item.id)
      if (i === -1) trip.items.push(item)
      else trip.items[i] = item
      commit()
    },

    async deleteItem(tripId: string, itemId: string): Promise<void> {
      const trip = store.trips[tripId]
      if (!trip) return
      trip.items = trip.items.filter((i) => i.id !== itemId)
      // Drop dangling edges, or the topological walk will throw on an unknown id.
      for (const item of trip.items) {
        item.dependsOn = item.dependsOn.filter((d) => d !== itemId)
      }
      commit()
    },

    async upsertMember(tripId: string, member: Member): Promise<void> {
      const trip = store.trips[tripId]
      if (!trip) return
      const i = trip.members.findIndex((m) => m.id === member.id)
      if (i === -1) trip.members.push(member)
      else trip.members[i] = member
      commit()
    },

    async removeMember(tripId: string, memberId: string): Promise<void> {
      const trip = store.trips[tripId]
      if (!trip) return
      trip.members = trip.members.filter((m) => m.id !== memberId)
      commit()
    },

    async setPreferences(tripId: string, memberId: string, prefs: Preferences): Promise<void> {
      const member = store.trips[tripId]?.members.find((m) => m.id === memberId)
      if (!member) return
      member.preferences = prefs
      commit()
    },

    async joinTrip(code: string): Promise<string> {
      const wanted = code.trim().toUpperCase()
      const found = Object.entries(store.codes).find(([, c]) => c === wanted)
      if (!found) throw new Error('No trip with that code')
      return found[0]
    },

    async inviteCode(tripId: string): Promise<string | null> {
      return store.codes[tripId] ?? null
    },
  }
}
