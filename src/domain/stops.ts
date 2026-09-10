import type { Stop } from './types'

export type StopDraft = Omit<Stop, 'id' | 'order'>

/** George Town. Stops added by hand get these until Phase 5 adds map-picking. */
export const DEFAULT_COORDS = { lat: 5.4141, lng: 100.3288 }

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export function nextStopId(stops: Stop[]): string {
  const highest = stops.reduce((max, stop) => {
    const match = /^s(\d+)$/.exec(stop.id)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `s${highest + 1}`
}

export function validateStop(draft: StopDraft, maxDay: number): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!draft.name.trim()) errors.name = 'Give the stop a name'
  if (!TIME.test(draft.start)) errors.start = 'Use a 24-hour time like 09:30'
  if (!Number.isFinite(draft.durationMin) || draft.durationMin <= 0) {
    errors.durationMin = 'Duration must be more than zero'
  }
  if (!Number.isFinite(draft.costPerPerson) || draft.costPerPerson < 0) {
    errors.costPerPerson = 'Cost cannot be negative'
  }
  if (draft.serves.length === 0) errors.serves = 'Pick at least one person this is for'
  const both = draft.conflicts.filter((id) => draft.serves.includes(id))
  if (both.length > 0) {
    errors.conflicts = 'Someone cannot be both served and shortchanged by one stop'
  }
  if (!Number.isInteger(draft.day) || draft.day < 1 || draft.day > maxDay) {
    errors.day = `Day must be between 1 and ${maxDay}`
  }

  return errors
}

/** Rewrites `order` for one day so it runs 1..n in the day's current sequence. */
function renumberDay(stops: Stop[], day: number): Stop[] {
  const ordered = stops
    .filter((s) => s.day === day)
    .sort((a, b) => a.order - b.order)
  const orders = new Map(ordered.map((s, i) => [s.id, i + 1]))
  return stops.map((s) => (orders.has(s.id) ? { ...s, order: orders.get(s.id)! } : s))
}

export function insertStop(stops: Stop[], draft: StopDraft): Stop[] {
  const sameDay = stops.filter((s) => s.day === draft.day)
  const stop: Stop = { ...draft, id: nextStopId(stops), order: sameDay.length + 1 }
  return renumberDay([...stops, stop], draft.day)
}

export function removeStop(stops: Stop[], id: string): Stop[] {
  const target = stops.find((s) => s.id === id)
  if (!target) return stops
  return renumberDay(
    stops.filter((s) => s.id !== id),
    target.day,
  )
}

export function moveStop(stops: Stop[], id: string, direction: 'up' | 'down'): Stop[] {
  const target = stops.find((s) => s.id === id)
  if (!target) return stops

  const sameDay = stops
    .filter((s) => s.day === target.day)
    .sort((a, b) => a.order - b.order)
  const from = sameDay.findIndex((s) => s.id === id)
  const to = direction === 'up' ? from - 1 : from + 1
  if (to < 0 || to >= sameDay.length) return stops

  const swapped = [...sameDay]
  swapped[from] = sameDay[to]
  swapped[to] = sameDay[from]

  const orders = new Map(swapped.map((s, i) => [s.id, i + 1]))
  return stops.map((s) => (orders.has(s.id) ? { ...s, order: orders.get(s.id)! } : s))
}

export function editStop(stops: Stop[], id: string, draft: StopDraft): Stop[] {
  const target = stops.find((s) => s.id === id)
  if (!target) return stops

  // Same day: a straight patch keeps the stop in its current slot.
  if (draft.day === target.day) {
    return stops.map((s) => (s.id === id ? { ...s, ...draft } : s))
  }

  // Different day: leaving `order` alone would duplicate an order in the new
  // day and leave a gap in the old one. Close the old day's sequence, then
  // append to the end of the new one.
  const withoutIt = renumberDay(stops.filter((s) => s.id !== id), target.day)
  const newDay = withoutIt.filter((s) => s.day === draft.day)
  const moved: Stop = { ...target, ...draft, id, order: newDay.length + 1 }
  return renumberDay([...withoutIt, moved], draft.day)
}
