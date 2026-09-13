import type { Cascade, Impairment, ItemOutcome, ItemStatus, Trip, TripItem } from '../types'

/** Minutes of slack assumed between one commitment ending and the next starting. */
export const BUFFER_MIN = 15

/** Depth-first topological order over the dependency edges. */
function topoOrder(items: TripItem[]): TripItem[] {
  const byId = new Map(items.map((i) => [i.id, i]))
  const seen = new Set<string>()
  const out: TripItem[] = []

  const visit = (item: TripItem, stack: Set<string>) => {
    if (seen.has(item.id)) return
    if (stack.has(item.id)) {
      throw new Error(`Dependency cycle at "${item.id}"`)
    }
    stack.add(item.id)
    for (const depId of item.dependsOn) {
      const dep = byId.get(depId)
      if (!dep) throw new Error(`"${item.id}" depends on unknown item "${depId}"`)
      visit(dep, stack)
    }
    stack.delete(item.id)
    seen.add(item.id)
    out.push(item)
  }

  for (const item of items) visit(item, new Set())
  return out
}

/**
 * Walk the dependency graph and work out what a set of impairments costs you.
 *
 * Two kinds of breakage, and they behave differently:
 *
 * **A delay** pushes an item later and everything downstream with it. An item
 * survives being late only if it has a window (a hotel desk open until 22:00);
 * a fixed booking does not slide just because you are late — it breaks.
 *
 * **An unavailable item** is taken out entirely: a rained-off trek, a closed
 * attraction, a cancelled ferry. It breaks itself and releases its slot, but it
 * does NOT automatically break whatever followed it. If the forest trek is
 * rained off, dinner afterwards is not broken by that — it is simply free to
 * happen earlier. Where one item genuinely cannot proceed without another, the
 * cause is a delay in the chain, which the first rule already handles.
 *
 * That distinction is a modelling choice, and it is the right one for local
 * travel: bad weather takes out several independent outdoor plans at once
 * rather than toppling a single chain.
 */
export function computeCascade(trip: Trip, impairments: Impairment[]): Cascade {
  const ordered = topoOrder(trip.items)
  const byImpairment = new Map(impairments.map((i) => [i.itemId, i]))
  /** Items removed from the plan — they no longer gate anything. */
  const removed = new Set(
    impairments.filter((i) => i.kind === 'unavailable').map((i) => i.itemId),
  )

  const effectiveEnd = new Map<string, number>()
  const outcomes: ItemOutcome[] = []

  for (const item of ordered) {
    const impairment = byImpairment.get(item.id)

    if (impairment?.kind === 'unavailable') {
      // Broken, and it frees its slot for whatever could use it.
      effectiveEnd.set(item.id, item.start)
      outcomes.push({
        itemId: item.id,
        status: 'broken',
        earliestStart: item.start,
        delayMin: 0,
        reason: impairment.reason,
      })
      continue
    }

    let earliestStart: number
    let status: ItemStatus
    let reason: string

    if (impairment?.kind === 'delay') {
      earliestStart = item.start + impairment.minutes
      status = 'shifted'
      reason = impairment.reason
    } else {
      const gates = item.dependsOn
        .filter((d) => !removed.has(d))
        .map((d) => (effectiveEnd.get(d) ?? 0) + BUFFER_MIN)
      earliestStart = Math.max(item.start, ...(gates.length ? gates : [item.start]))

      if (earliestStart <= item.start) {
        status = 'safe'
        reason = 'Unaffected'
      } else if (item.windowEnd !== undefined && earliestStart <= item.windowEnd) {
        status = 'shifted'
        reason = `Still inside its window — arrive by ${fmt(item.windowEnd)}`
      } else {
        status = 'broken'
        reason =
          item.windowEnd !== undefined
            ? `Window closes at ${fmt(item.windowEnd)}, earliest arrival ${fmt(earliestStart)}`
            : `Booked for ${fmt(item.start)}, earliest arrival ${fmt(earliestStart)}`
      }
    }

    effectiveEnd.set(item.id, earliestStart + item.durationMin)
    outcomes.push({
      itemId: item.id,
      status,
      earliestStart,
      delayMin: Math.max(0, earliestStart - item.start),
      reason,
    })
  }

  const pick = (st: ItemStatus) => outcomes.filter((o) => o.status === st).map((o) => o.itemId)
  const brokenIds = pick('broken')
  const byId = new Map(trip.items.map((i) => [i.id, i]))

  // Money already committed to things that are now broken and cannot be refunded.
  const atRisk = brokenIds.reduce((sum, id) => {
    const item = byId.get(id)
    return item ? sum + item.cost * (1 - item.refundRate) : sum
  }, 0)

  return {
    impairments,
    outcomes,
    brokenIds,
    shiftedIds: pick('shifted'),
    safeIds: pick('safe'),
    atRisk,
  }
}

export function fmt(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

export function formatMins(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}
