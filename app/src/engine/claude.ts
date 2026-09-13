import type { Cascade, RepairOption, RepairResult, Trip, TripItem } from '../types'
import type { RepairConstraints } from './repair'
import { buildOption, localRepair, planActions } from './repair'

/** Where the edge function lives. Unset in dev — the app falls back to the local engine. */
const ENDPOINT = import.meta.env.VITE_REPAIR_ENDPOINT as string | undefined

interface ModelAction { itemId: string; kind: 'move' | 'drop' }
interface ModelOption {
  id: string
  name: string
  strategy: string
  actions: ModelAction[]
  rationale: string
}

/**
 * Ask the model for repair strategies, then price them locally.
 *
 * The model chooses which bookings to move and which to drop, and writes the
 * sentence a friend would say. Every figure — rebooking fees, refunds, each
 * person's share, who goes over their ceiling — is computed here from the
 * trip's own rows. The model is never asked for a number, so it cannot invent one.
 *
 * Any failure (no endpoint, no network, bad response) falls back to the offline
 * engine. A demo should not be at the mercy of venue wifi.
 */
export async function repair(
  trip: Trip, cascade: Cascade, constraints: RepairConstraints = {},
): Promise<RepairResult> {
  if (!ENDPOINT) return localRepair(trip, cascade, constraints)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ trip, cascade }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`Repair endpoint returned ${res.status}`)

    const data = (await res.json()) as { options?: ModelOption[] }
    if (!Array.isArray(data.options) || data.options.length === 0) {
      throw new Error('Repair endpoint returned no options')
    }

    const byId = new Map(trip.items.map((i) => [i.id, i]))
    const broken = cascade.brokenIds.map((id) => byId.get(id)!).filter(Boolean) as TripItem[]

    const options: RepairOption[] = data.options.map((opt) => {
      const moves = new Set(
        opt.actions.filter((a) => a.kind === 'move').map((a) => a.itemId),
      )
      const actions = planActions(trip, cascade, broken, (item) => moves.has(item.id), constraints)
      const priced = buildOption(trip, opt.id, opt.name, opt.strategy, actions)
      // Keep the model's sentence; keep our arithmetic.
      return { ...priced, rationale: opt.rationale || priced.rationale }
    })

    return { options, source: 'claude' }
  } catch (err) {
    console.warn('[repair] falling back to the offline engine:', err)
    return localRepair(trip, cascade, constraints)
  }
}
