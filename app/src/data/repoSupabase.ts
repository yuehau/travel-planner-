import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Interest, Member, Pace, Preferences, Trip, TripItem } from '../types'
import type { NewTrip, TripRepo, TripSummary } from './repo'

/**
 * The real backend: accounts, shared trips, row-level security.
 *
 * ⚠️ UNVERIFIED AGAINST A LIVE PROJECT. The build environment could not create
 * a Supabase project (the organisation is at its two-project free limit), so
 * this adapter has been written against the schema in
 * `supabase/migrations/0001_init.sql` but never executed. Expect to shake out
 * one or two column-name mismatches on first run. `getRepo()` falls back to the
 * local adapter on any failure, so a mistake here degrades rather than breaks.
 */

const DEFAULT_TONES = ['#0f766e', '#b45309', '#7c3aed', '#0369a1', '#be185d', '#15803d']

interface ItemRow {
  id: string
  title: string
  detail: string
  icon: string
  day: number
  start_min: number
  duration_min: number
  cost: string | number
  prepaid: boolean
  refund_rate: string | number
  flexibility: TripItem['flexibility']
  interest: Interest
  outdoor: boolean
  window_end: number | null
  sensible_earliest: number | null
  sensible_latest: number | null
}

const num = (v: string | number | null | undefined): number => Number(v ?? 0)

function toItem(row: ItemRow, dependsOn: string[]): TripItem {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    icon: row.icon,
    day: row.day,
    start: row.start_min,
    durationMin: row.duration_min,
    cost: num(row.cost),
    prepaid: row.prepaid,
    refundRate: num(row.refund_rate),
    dependsOn,
    flexibility: row.flexibility,
    interest: row.interest,
    outdoor: row.outdoor,
    ...(row.window_end !== null ? { windowEnd: row.window_end } : {}),
    ...(row.sensible_earliest !== null && row.sensible_latest !== null
      ? { sensibleHours: { earliest: row.sensible_earliest, latest: row.sensible_latest } }
      : {}),
  }
}

function fromItem(tripId: string, item: TripItem) {
  return {
    id: item.id,
    trip_id: tripId,
    title: item.title,
    detail: item.detail,
    icon: item.icon,
    day: item.day,
    start_min: item.start,
    duration_min: item.durationMin,
    cost: item.cost,
    prepaid: item.prepaid,
    refund_rate: item.refundRate,
    flexibility: item.flexibility,
    interest: item.interest,
    outdoor: item.outdoor,
    window_end: item.windowEnd ?? null,
    sensible_earliest: item.sensibleHours?.earliest ?? null,
    sensible_latest: item.sensibleHours?.latest ?? null,
  }
}

const EMPTY_INTERESTS: Record<Interest, number> = {
  food: 3, culture: 3, nature: 3, nightlife: 3, rest: 3,
}

export async function createSupabaseRepo(url: string, key: string): Promise<TripRepo> {
  const db: SupabaseClient = createClient(url, key)

  // Fail fast so getRepo() can fall back before the UI renders.
  const { error } = await db.from('trips').select('id').limit(1)
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Supabase unreachable: ${error.message}`)
  }

  const currentUser = async (): Promise<string | null> => {
    const { data } = await db.auth.getUser()
    return data.user?.id ?? null
  }

  const getTrip = async (id: string): Promise<Trip | null> => {
    const { data: trip, error } = await db
      .from('trips')
      .select('id, destination, start_date, nights, budget, lat, lon')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!trip) return null

    const [{ data: itemRows }, { data: depRows }, { data: memberRows }, { data: prefRows }] =
      await Promise.all([
        db.from('items').select('*').eq('trip_id', id).order('day').order('start_min'),
        db.from('item_deps').select('item_id, depends_on_id'),
        db.from('trip_members').select('user_id, profiles(display_name, tone)').eq('trip_id', id),
        db.from('preferences').select('*').eq('trip_id', id),
      ])

    const depsFor = new Map<string, string[]>()
    for (const d of depRows ?? []) {
      const list = depsFor.get(d.item_id) ?? []
      list.push(d.depends_on_id)
      depsFor.set(d.item_id, list)
    }

    const items = (itemRows ?? []).map((r) =>
      toItem(r as ItemRow, depsFor.get((r as ItemRow).id) ?? []),
    )

    type MemberRow = { user_id: string; profiles: { display_name: string; tone: string } | null }
    const members: Member[] = ((memberRows as MemberRow[] | null) ?? []).map((m, i) => {
      const pref = (prefRows ?? []).find((p) => p.user_id === m.user_id)
      const preferences: Preferences = {
        interests: (pref?.interests as Record<Interest, number>) ?? EMPTY_INTERESTS,
        budgetCeiling: num(pref?.budget_ceiling),
        pace: (pref?.pace as Pace) ?? 'balanced',
        nonNegotiables: (pref?.non_negotiables as string[]) ?? [],
        ...(pref?.note ? { note: pref.note as string } : {}),
      }
      return {
        id: m.user_id,
        name: m.profiles?.display_name || 'Traveller',
        tone: m.profiles?.tone || DEFAULT_TONES[i % DEFAULT_TONES.length],
        preferences,
      }
    })

    return {
      id: trip.id,
      destination: trip.destination,
      startDate: trip.start_date,
      lat: num(trip.lat),
      lon: num(trip.lon),
      nights: trip.nights,
      budget: num(trip.budget),
      members,
      items,
    }
  }

  return {
    mode: 'supabase',
    note: 'Signed in — trips are saved to the database and shared with everyone on them.',
    getTrip,

    async listTrips(): Promise<TripSummary[]> {
      // RLS limits this to trips the caller is a member of, so no filter is needed.
      const { data, error } = await db
        .from('trips')
        .select('id, destination, start_date, nights, trip_members(count), items(count)')
        .order('start_date')
      if (error) throw error

      type Row = {
        id: string; destination: string; start_date: string; nights: number
        trip_members: { count: number }[]; items: { count: number }[]
      }
      return ((data ?? []) as Row[]).map((r) => ({
        id: r.id,
        destination: r.destination,
        startDate: r.start_date,
        nights: r.nights,
        memberCount: r.trip_members?.[0]?.count ?? 0,
        itemCount: r.items?.[0]?.count ?? 0,
      }))
    },

    async createTrip(input: NewTrip): Promise<Trip> {
      const owner = await currentUser()
      if (!owner) throw new Error('Sign in before creating a trip')

      const { data, error } = await db
        .from('trips')
        .insert({
          owner_id: owner,
          destination: input.destination,
          destination_id: input.destinationId,
          start_date: input.startDate,
          nights: input.nights,
          budget: input.budget,
          lat: input.lat,
          lon: input.lon,
        })
        .select('id')
        .single()
      if (error) throw error

      // The on_trip_created trigger has already added the owner as a member.
      const trip = await getTrip(data.id)
      if (!trip) throw new Error('Trip created but could not be read back')
      return trip
    },

    async deleteTrip(id: string): Promise<void> {
      const { error } = await db.from('trips').delete().eq('id', id)
      if (error) throw error
    },

    async upsertItem(tripId: string, item: TripItem): Promise<void> {
      const { error } = await db.from('items').upsert(fromItem(tripId, item))
      if (error) throw error

      // Replace this item's edges wholesale — simpler than diffing, and the
      // edge count per item is tiny.
      await db.from('item_deps').delete().eq('item_id', item.id)
      if (item.dependsOn.length > 0) {
        const { error: depError } = await db
          .from('item_deps')
          .insert(item.dependsOn.map((d) => ({ item_id: item.id, depends_on_id: d })))
        if (depError) throw depError
      }
    },

    async deleteItem(_tripId: string, itemId: string): Promise<void> {
      // Edges cascade on the foreign key, in both directions.
      const { error } = await db.from('items').delete().eq('id', itemId)
      if (error) throw error
    },

    async upsertMember(_tripId: string, member: Member): Promise<void> {
      const { error } = await db
        .from('profiles')
        .update({ display_name: member.name, tone: member.tone })
        .eq('id', member.id)
      if (error) throw error
    },

    async removeMember(tripId: string, memberId: string): Promise<void> {
      const { error } = await db
        .from('trip_members')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', memberId)
      if (error) throw error
    },

    async setPreferences(tripId: string, memberId: string, prefs: Preferences): Promise<void> {
      const { error } = await db.from('preferences').upsert({
        trip_id: tripId,
        user_id: memberId,
        interests: prefs.interests,
        budget_ceiling: prefs.budgetCeiling,
        pace: prefs.pace,
        non_negotiables: prefs.nonNegotiables,
        note: prefs.note ?? null,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },

    async joinTrip(code: string): Promise<string> {
      // A function, not an insert: RLS cannot validate an invite code, so the
      // check lives in the database instead.
      const { data, error } = await db.rpc('join_trip_by_code', { p_code: code })
      if (error) throw error
      return data as string
    },

    async inviteCode(tripId: string): Promise<string | null> {
      const { data, error } = await db
        .from('trips')
        .select('invite_code')
        .eq('id', tripId)
        .maybeSingle()
      if (error) throw error
      return data?.invite_code ?? null
    },
  }
}
