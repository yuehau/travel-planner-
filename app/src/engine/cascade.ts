import type { Cascade, ItemOutcome, ItemStatus, Trip, TripItem } from '../types'

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
 * Walk the dependency graph from a delayed item and work out what else breaks.
 *
 * An item survives being late only if it has a window (a check-in desk open
 * until 22:00). A fixed booking does not slide just because you are late —
 * it breaks, and something has to be done about it. That distinction is the
 * whole reason this is a graph and not a list.
 */
export function computeCascade(trip: Trip, triggerItemId: string, delayMin: number): Cascade {
  const ordered = topoOrder(trip.items)
  const effectiveEnd = new Map<string, number>()
  const outcomes: ItemOutcome[] = []

  for (const item of ordered) {
    let earliestStart: number
    let status: ItemStatus
    let reason: string

    if (item.id === triggerItemId) {
      earliestStart = item.start + delayMin
      status = 'shifted'
      reason = `Delayed by ${formatMins(delayMin)}`
    } else {
      const gated = item.dependsOn.map((d) => (effectiveEnd.get(d) ?? 0) + BUFFER_MIN)
      earliestStart = Math.max(item.start, ...(gated.length ? gated : [item.start]))

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

  const pick = (s: ItemStatus) => outcomes.filter((o) => o.status === s).map((o) => o.itemId)
  const brokenIds = pick('broken')
  const byId = new Map(trip.items.map((i) => [i.id, i]))

  // Money already committed to things that are now broken and cannot be refunded.
  const atRisk = brokenIds.reduce((sum, id) => {
    const item = byId.get(id)
    if (!item) return sum
    return sum + item.cost * (1 - item.refundRate)
  }, 0)

  return {
    triggerItemId,
    delayMin,
    outcomes,
    brokenIds,
    shiftedIds: pick('shifted').filter((id) => id !== triggerItemId),
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
