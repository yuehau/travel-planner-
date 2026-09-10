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
