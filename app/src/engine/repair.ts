import type {
  Cascade, Member, MemberImpact, RepairAction, RepairOption, RepairResult, Trip, TripItem,
} from '../types'
import { BUFFER_MIN, fmt } from './cascade'

/**
 * Backstop for when an item declares no sensible hours of its own. Nobody on a
 * trip with a 06:30 start wants a new activity beginning at 23:00.
 */
const DAY_END = 21 * 60 + 30
/** Rebooking surcharge, as a fraction of the item's cost. */
const MOVE_FEE_RATE = 0.25

/** Every item that must survive for `id` to still be reachable. */
function dependents(trip: Trip, id: string): Set<string> {
  const out = new Set<string>()
  const walk = (target: string) => {
    for (const item of trip.items) {
      if (item.dependsOn.includes(target) && !out.has(item.id)) {
        out.add(item.id)
        walk(item.id)
      }
    }
  }
  walk(id)
  return out
}

/**
 * An item is essential when something still standing depends on it.
 * You cannot drop the airport transfer: the hotel check-in needs it.
 */
function isEssential(trip: Trip, cascade: Cascade, id: string): boolean {
  const surviving = new Set([...cascade.safeIds, ...cascade.shiftedIds])
  return [...dependents(trip, id)].some((d) => surviving.has(d))
}

interface Slot { day: number; start: number; end: number }

/**
 * Extra rules a replacement slot has to satisfy.
 *
 * `slotViable` is what stops the engine rebooking a rained-off trek into the
 * same storm — without it, "move it later today" is technically a free slot and
 * completely useless advice.
 */
export interface RepairConstraints {
  slotViable?: (item: TripItem, day: number, start: number) => boolean
}

/** Granularity we consider when hunting for a replacement slot. */
const SLOT_STEP_MIN = 30

/**
 * The last minute of a day that is still usable.
 *
 * A locked item with nothing scheduled after it is a departure — once you have
 * driven back to KL the day is over, and "we found you a free slot at 19:15"
 * is worse than useless. A locked item with things after it (the drive up on
 * the first morning) is an arrival, and does not end anything.
 */
function usableEndOfDay(trip: Trip, day: number): number {
  const onDay = trip.items.filter((i) => i.day === day)
  const departure = onDay.find(
    (i) => i.flexibility === 'locked' && !onDay.some((o) => o.id !== i.id && o.start > i.start),
  )
  return departure ? Math.min(DAY_END, departure.start) : DAY_END
}

/** Slots taken by everything still standing, at its post-impairment time. */
function survivingSlots(trip: Trip, cascade: Cascade): Slot[] {
  const keep = new Set([...cascade.safeIds, ...cascade.shiftedIds])
  return trip.items
    .filter((i) => keep.has(i.id) && i.durationMin > 0)
    .map((i) => {
      const start = cascade.outcomes.find((o) => o.itemId === i.id)?.earliestStart ?? i.start
      return { day: i.day, start, end: start + i.durationMin }
    })
}

function collides(day: number, start: number, durationMin: number, taken: Slot[]): boolean {
  const end = start + durationMin
  return taken.some(
    (s) => s.day === day && start < s.end + BUFFER_MIN && s.start < end + BUFFER_MIN,
  )
}

/**
 * Earliest viable start on `day`, or null.
 *
 * Walks candidate starts rather than only the gaps between bookings, because a
 * slot can be free and still unusable — a downpour is not on the calendar.
 */
export function findSlot(
  trip: Trip,
  item: TripItem,
  day: number,
  notBefore: number,
  taken: Slot[],
  constraints: RepairConstraints = {},
): number | null {
  const sensible = item.sensibleHours
  const earliest = Math.max(notBefore, sensible?.earliest ?? 8 * 60)
  const latest = Math.min(
    usableEndOfDay(trip, day) - item.durationMin,
    sensible?.latest ?? DAY_END - item.durationMin,
  )

  for (let start = earliest; start <= latest; start += SLOT_STEP_MIN) {
    if (collides(day, start, item.durationMin, taken)) continue
    if (constraints.slotViable && !constraints.slotViable(item, day, start)) continue
    return start
  }
  return null
}

/** Where a broken item can go: later today if it fits, otherwise a later day. */
function relocate(
  trip: Trip, cascade: Cascade, item: TripItem, taken: Slot[], constraints: RepairConstraints,
): { day: number; start: number } | null {
  const earliest = cascade.outcomes.find((o) => o.itemId === item.id)?.earliestStart ?? item.start

  const sameDay = findSlot(trip, item, item.day, earliest, taken, constraints)
  if (sameDay !== null) return { day: item.day, start: sameDay }

  const lastDay = Math.max(...trip.items.map((i) => i.day))
  for (let day = item.day + 1; day <= lastDay; day++) {
    const slot = findSlot(trip, item, day, 8 * 60, taken, constraints)
    if (slot !== null) return { day, start: slot }
  }
  return null
}

/**
 * Turn a per-item decision into concrete actions, placing each move against a
 * schedule that grows as we go so two moved bookings cannot land on each other.
 */
export function planActions(
  trip: Trip,
  cascade: Cascade,
  broken: TripItem[],
  wantsMove: (i: TripItem) => boolean,
  constraints: RepairConstraints = {},
): RepairAction[] {
  const taken = survivingSlots(trip, cascade)
  const ordered = [...broken].sort((a, b) => a.day - b.day || a.start - b.start)

  return ordered.map((item) => {
    if (!wantsMove(item)) return { kind: 'drop' as const, itemId: item.id }
    const slot = relocate(trip, cascade, item, taken, constraints)
    if (!slot) return { kind: 'drop' as const, itemId: item.id }
    taken.push({ day: slot.day, start: slot.start, end: slot.start + item.durationMin })
    return { kind: 'move' as const, itemId: item.id, toDay: slot.day, toStart: slot.start }
  })
}

function costOf(trip: Trip, actions: RepairAction[]): number {
  const byId = new Map(trip.items.map((i) => [i.id, i]))
  return actions.reduce((delta, action) => {
    const item = byId.get(action.itemId)
    if (!item) return delta
    if (action.kind === 'move') return delta + Math.round(item.cost * MOVE_FEE_RATE)
    // Dropping recovers only the refundable portion. The rest is already spent.
    if (action.kind === 'drop') return delta - Math.round(item.cost * item.refundRate)
    return delta
  }, 0)
}

/** How well a plan serves one member, as a percentage of the original plan. */
function fitFor(trip: Trip, member: Member, droppedIds: Set<string>): number {
  const weight = (i: TripItem) => member.preferences.interests[i.interest] ?? 1
  const ideal = trip.items.reduce((s, i) => s + weight(i) * (i.durationMin || 30), 0)
  const actual = trip.items
    .filter((i) => !droppedIds.has(i.id))
    .reduce((s, i) => s + weight(i) * (i.durationMin || 30), 0)
  return ideal === 0 ? 100 : (actual / ideal) * 100
}

function impactsFor(trip: Trip, actions: RepairAction[]): MemberImpact[] {
  const dropped = new Set(actions.filter((a) => a.kind === 'drop').map((a) => a.itemId))
  const newTotal = trip.items.reduce((s, i) => s + i.cost, 0) + costOf(trip, actions)
  const share = Math.round(newTotal / trip.members.length)

  return trip.members.map((member) => ({
    memberId: member.id,
    fitDelta: Number((fitFor(trip, member, dropped) - 100).toFixed(1)),
    share,
    overCeiling: share > member.preferences.budgetCeiling,
    sacrificed: member.preferences.nonNegotiables.filter((id) => dropped.has(id)),
  }))
}

/** The member whose constraint is doing the most work to rule options out. */
function bindingConstraint(trip: Trip, impacts: MemberImpact[]): string | undefined {
  const over = impacts.filter((i) => i.overCeiling)
  if (over.length === 0) return undefined
  const tightest = trip.members
    .filter((m) => over.some((o) => o.memberId === m.id))
    .sort((a, b) => a.preferences.budgetCeiling - b.preferences.budgetCeiling)[0]
  const share = over.find((o) => o.memberId === tightest.id)!.share
  return `${tightest.name}'s RM${tightest.preferences.budgetCeiling} ceiling — this puts their share at RM${share}`
}

export function buildOption(
  trip: Trip, id: string, name: string, strategy: string, actions: RepairAction[],
): RepairOption {
  const byId = new Map(trip.items.map((i) => [i.id, i]))
  const impacts = impactsFor(trip, actions)
  const costDelta = costOf(trip, actions)

  const moved = actions.filter((a) => a.kind === 'move')
  const dropped = actions.filter((a) => a.kind === 'drop')
  const sacrificedNames = trip.members
    .flatMap((m) => impacts.find((i) => i.memberId === m.id)!.sacrificed.map((s) => ({ m, s })))
    .map(({ m, s }) => `${m.name}'s ${byId.get(s)?.title ?? s}`)

  const parts: string[] = []
  if (moved.length) parts.push(`Moves ${moved.length} booking${moved.length > 1 ? 's' : ''}`)
  if (dropped.length) parts.push(`drops ${dropped.map((d) => byId.get(d.itemId)?.title).join(' and ')}`)
  const money = costDelta === 0 ? 'no change to the total'
    : costDelta > 0 ? `costs RM${costDelta} more`
    : `saves RM${Math.abs(costDelta)}`
  const joined = parts.join(', ')
  const cost_clause = `${joined.charAt(0).toUpperCase()}${joined.slice(1)} — ${money}`
  const sacrifice = sacrificedNames.length
    ? ` Sacrifices ${sacrificedNames.join(' and ')}.`
    : ' Everyone keeps what they flagged as a must-do.'

  return {
    id, name, strategy, actions, costDelta, impacts,
    rationale: `${cost_clause}.${sacrifice}`,
    bindingConstraint: bindingConstraint(trip, impacts),
  }
}

/**
 * Offline repair generator.
 *
 * Three options that embody three different values, not three points on one
 * axis: protect what people said mattered, spend the least, or save the evening.
 * A group cannot choose between them without saying what it cares about — which
 * is exactly the conversation the product exists to make possible.
 */
export function localRepair(
  trip: Trip, cascade: Cascade, constraints: RepairConstraints = {},
): RepairResult {
  const byId = new Map(trip.items.map((i) => [i.id, i]))
  const broken = cascade.brokenIds.map((id) => byId.get(id)!).filter(Boolean)

  // 1 — Preserve: rebook everything that can be rebooked.
  const preserve = planActions(trip, cascade, broken, () => true, constraints)

  // 2 — Economise: keep only what the surviving plan structurally depends on.
  const economise = planActions(
    trip, cascade, broken, (i) => isEssential(trip, cascade, i.id), constraints,
  )

  // 3 — Save the evening: keep essentials and the cheap social item, shed the costly one.
  const costliest = [...broken]
    .filter((i) => !isEssential(trip, cascade, i.id))
    .sort((a, b) => b.cost - a.cost)[0]
  const recover = planActions(trip, cascade, broken, (i) => i.id !== costliest?.id, constraints)

  return {
    source: 'local',
    options: [
      buildOption(trip, 'preserve', 'Preserve', 'Protect every must-do, whatever it costs', preserve),
      buildOption(trip, 'economise', 'Economise', 'Spend the least, accept the losses', economise),
      buildOption(trip, 'recover', 'Shelter', 'Keep what can be saved, shed the costliest casualty', recover),
    ],
  }
}

/** Human-readable summary of one action, for the UI. */
export function describeAction(trip: Trip, action: RepairAction): string {
  const item = trip.items.find((i) => i.id === action.itemId)
  if (!item) return ''
  if (action.kind === 'drop') {
    const back = Math.round(item.cost * item.refundRate)
    return back > 0 ? `Cancelled · RM${back} refunded` : `Cancelled · RM${item.cost} already spent`
  }
  if (action.kind === 'move') {
    const fee = Math.round(item.cost * MOVE_FEE_RATE)
    const when = action.toDay === item.day ? `later today, ${fmt(action.toStart)}` : `Day ${action.toDay}, ${fmt(action.toStart)}`
    return fee > 0 ? `Moved to ${when} · RM${fee} rebooking fee` : `Moved to ${when}`
  }
  return 'Unchanged'
}
