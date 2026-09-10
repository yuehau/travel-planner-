# Mindmap Travel Planner — Phase 2 (Editing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the planner editable — add, edit, delete and reorder stops, with validation, changes persisting across reload.

**Architecture:** All mutation logic lives as pure functions in `src/domain/stops.ts` with no React and no store import, so it is directly testable. The Zustand store's new actions are thin delegations to those functions. One `StopForm` component serves both the edit drawer and the add modal.

**Tech Stack:** Vite 8, React 19, TypeScript, `@xyflow/react` v12, Tailwind CSS v4, Mantine 9, Zustand 5, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-08-mindmap-travel-planner-design.md` (Phase 2 in the Phasing table)

**Prior phase:** `docs/superpowers/plans/2026-09-08-phase-1-foundation.md` — complete, 31 tests passing.

## Global Constraints

- No backend, no database, no auth, no router dependency. No API key committed.
- Desktop browser only. Persistence is `localStorage` only, via Zustand's `persist`.
- **`partialize` in `src/store/tripStore.ts` is an allowlist.** Any NEW persisted state field must be added to it by hand or it silently stops persisting. Phase 2 adds actions only, not persisted fields — if you find yourself adding a field, stop and flag it.
- **Do not touch** the `transitionProps={{ duration: 200, exitDuration: 0 }}` prop on the Drawer in `NodeDrawer.tsx` or its explanatory comment. It fixes a real overlay bug and the comment records why.
- **Do not touch** the CSS setup: `src/index.css`'s `@layer` statement, the import order in `src/main.tsx`, `postcss.config.cjs`, or `vite.config.ts`. Four fix rounds went into that arrangement.
- **Do not re-enable** the Itinerary/People segments in `Header.tsx`, and do not add `lens` back to `partialize`. Both are Phase 4.
- Field naming is `color`, never `colour`.
- Stop ids are `s<n>` and must never collide with `b*`, `e*`, `m*`, `cat-*` or `trip` — React Flow forbids duplicate node ids.
- **Two invariants the existing tests enforce; do not break them:** every stop serves at least one member, and `order` values are contiguous from 1 within each day.
- New stops get placeholder coordinates (George Town). Map-picking is Phase 5; do not build it.

---

### Task 1: Fix the empty-group fallback in the category lens

Phase 1's final review flagged this and deferred it. Task 4 ships delete, which is what makes it reachable — so it goes first.

**Files:**
- Modify: `src/graph/categories.ts`
- Test: `src/domain/__tests__/categories.test.ts`

**Interfaces:**
- Consumes: `buildCategoriesGraph(state)` from `src/graph/categories.ts`, `seed` from `src/store/seed.ts`.
- Produces: no signature change. Behaviour change only: an empty group's category node no longer lands at y=0.

- [ ] **Step 1: Write the failing test**

Append to `src/domain/__tests__/categories.test.ts`:

```ts
describe('categories lens with an empty group', () => {
  const emptied = { ...seed, expenses: [] }
  const g = buildCategoriesGraph(emptied)
  const categoryY = (id: string) => g.nodes.find((n) => n.id === id)!.position.y

  it('still renders all four category nodes', () => {
    for (const id of ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people']) {
      expect(g.nodes.some((n) => n.id === id)).toBe(true)
    }
  })

  it('does not drop the empty category onto the centreline', () => {
    expect(categoryY('cat-budget')).not.toBe(0)
  })

  it('keeps every category node at a distinct y', () => {
    const ys = ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people'].map(categoryY)
    expect(new Set(ys).size).toBe(4)
  })

  it('keeps the empty category in sequence between its neighbours', () => {
    expect(categoryY('cat-budget')).toBeGreaterThan(categoryY('cat-bookings'))
    expect(categoryY('cat-budget')).toBeLessThan(categoryY('cat-people'))
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/categories.test.ts`
Expected: FAIL — `cat-budget` sits at y=0, so "does not drop the empty category onto the centreline" fails, and the distinct-y and in-sequence assertions fail with it.

- [ ] **Step 3: Fix the fallback**

In `src/graph/categories.ts`, replace the `const centre = ...` assignment inside the group loop:

```ts
    // An empty group has no leaves to centre between. Fall back to where its
    // first leaf would have sat, so the category node stays in sequence with
    // its neighbours instead of landing on the map's centreline — where it
    // would overlap whichever group happens to straddle y=0.
    const centre = group.leaves.length
      ? (leafY[first] + leafY[cursor - 1]) / 2
      : (leafY[first] ?? leafY[leafY.length - 1] ?? 0)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/categories.test.ts`
Expected: PASS — 11 tests (7 existing + 4 new).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 35 tests.

- [ ] **Step 6: Commit**

```bash
git add src/graph/categories.ts src/domain/__tests__/categories.test.ts
git commit -m "fix: keep empty category nodes in sequence instead of on the centreline"
```

---

### Task 2: Stop ids and validation

**Files:**
- Create: `src/domain/stops.ts`
- Test: `src/domain/__tests__/stops.test.ts`

**Interfaces:**
- Consumes: `Stop`, `StopCategory`, `MemberId` from `src/domain/types.ts`.
- Produces:
  - `export type StopDraft = Omit<Stop, 'id' | 'order'>`
  - `export const DEFAULT_COORDS: { lat: number; lng: number }`
  - `export function nextStopId(stops: Stop[]): string`
  - `export function validateStop(draft: StopDraft, maxDay: number): Record<string, string>` — returns field-name → message; an empty object means valid.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/stops.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_COORDS, nextStopId, validateStop, type StopDraft } from '../stops'
import { seed } from '../../store/seed'

const valid: StopDraft = {
  day: 1,
  name: 'Penang Botanic Gardens',
  start: '09:00',
  durationMin: 60,
  costPerPerson: 0,
  lat: DEFAULT_COORDS.lat,
  lng: DEFAULT_COORDS.lng,
  category: 'nature',
  serves: ['m3'],
  conflicts: [],
  reason: 'A slow green hour for Mei.',
}

describe('nextStopId', () => {
  it('follows the highest existing numeric suffix', () => {
    expect(nextStopId(seed.stops)).toBe('s12')
  })

  it('does not reuse an id after a gap', () => {
    const withGap = seed.stops.filter((s) => s.id !== 's5')
    expect(nextStopId(withGap)).toBe('s12')
  })

  it('starts at s1 when there are no stops', () => {
    expect(nextStopId([])).toBe('s1')
  })

  it('never collides with booking, expense or member ids', () => {
    const id = nextStopId(seed.stops)
    const taken = new Set([
      ...seed.stops.map((s) => s.id),
      ...seed.bookings.map((b) => b.id),
      ...seed.expenses.map((e) => e.id),
      ...seed.members.map((m) => m.id),
    ])
    expect(taken.has(id)).toBe(false)
  })
})

describe('validateStop', () => {
  it('accepts a well-formed draft', () => {
    expect(validateStop(valid, 3)).toEqual({})
  })

  it('rejects a blank name', () => {
    expect(validateStop({ ...valid, name: '   ' }, 3)).toHaveProperty('name')
  })

  it('rejects a malformed start time', () => {
    for (const start of ['9:00', '25:00', '12:60', 'morning', '']) {
      expect(validateStop({ ...valid, start }, 3)).toHaveProperty('start')
    }
  })

  it('accepts boundary start times', () => {
    for (const start of ['00:00', '23:59']) {
      expect(validateStop({ ...valid, start }, 3)).toEqual({})
    }
  })

  it('rejects a non-positive duration', () => {
    expect(validateStop({ ...valid, durationMin: 0 }, 3)).toHaveProperty('durationMin')
    expect(validateStop({ ...valid, durationMin: -30 }, 3)).toHaveProperty('durationMin')
  })

  it('rejects a negative cost but allows zero', () => {
    expect(validateStop({ ...valid, costPerPerson: -1 }, 3)).toHaveProperty('costPerPerson')
    expect(validateStop({ ...valid, costPerPerson: 0 }, 3)).toEqual({})
  })

  it('requires the stop to serve at least one member', () => {
    expect(validateStop({ ...valid, serves: [] }, 3)).toHaveProperty('serves')
  })

  it('rejects a member who is both served and conflicted', () => {
    expect(validateStop({ ...valid, serves: ['m3'], conflicts: ['m3'] }, 3)).toHaveProperty('conflicts')
  })

  it('rejects a day outside the trip', () => {
    expect(validateStop({ ...valid, day: 0 }, 3)).toHaveProperty('day')
    expect(validateStop({ ...valid, day: 4 }, 3)).toHaveProperty('day')
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const errors = validateStop({ ...valid, name: '', start: 'nope', serves: [] }, 3)
    expect(Object.keys(errors).sort()).toEqual(['name', 'serves', 'start'])
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/stops.test.ts`
Expected: FAIL — cannot resolve `../stops`.

- [ ] **Step 3: Write the module**

Create `src/domain/stops.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/stops.test.ts`
Expected: PASS — 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/stops.ts src/domain/__tests__/stops.test.ts
git commit -m "feat: add stop id generation and draft validation"
```

---

### Task 3: Insert, remove and reorder

**Files:**
- Modify: `src/domain/stops.ts`
- Test: `src/domain/__tests__/stops.test.ts`

**Interfaces:**
- Consumes: `StopDraft`, `nextStopId` from Task 2.
- Produces:
  - `export function insertStop(stops: Stop[], draft: StopDraft): Stop[]`
  - `export function removeStop(stops: Stop[], id: string): Stop[]`
  - `export function moveStop(stops: Stop[], id: string, direction: 'up' | 'down'): Stop[]`
  - `export function editStop(stops: Stop[], id: string, draft: StopDraft): Stop[]`

All four are pure and return a new array. All four keep `order` contiguous from 1 within each affected day.

`editStop` exists because a plain field patch is wrong when the edit changes `day`: the stop would keep its old day's `order`, leaving a duplicate order in the new day and a gap in the old one. That breaks the contiguity invariant the seed tests assert and the Task 1 layout fix relies on. `editStop` handles the same-day case as a simple patch and the cross-day case as a remove-and-append.

- [ ] **Step 1: Write the failing test**

Append to `src/domain/__tests__/stops.test.ts`:

```ts
import { insertStop, moveStop, removeStop } from '../stops'

const ordersFor = (stops: typeof seed.stops, day: number) =>
  stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => s.order)

const namesFor = (stops: typeof seed.stops, day: number) =>
  stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => s.name)

describe('insertStop', () => {
  it('appends to the end of its day with the next order', () => {
    const next = insertStop(seed.stops, valid)
    const added = next.find((s) => s.name === 'Penang Botanic Gardens')!
    expect(added.id).toBe('s12')
    expect(added.day).toBe(1)
    expect(added.order).toBe(5)
    expect(next).toHaveLength(seed.stops.length + 1)
  })

  it('keeps day orders contiguous', () => {
    const next = insertStop(seed.stops, { ...valid, day: 3 })
    expect(ordersFor(next, 3)).toEqual([1, 2, 3, 4])
  })

  it('does not mutate the input', () => {
    const before = seed.stops.length
    insertStop(seed.stops, valid)
    expect(seed.stops).toHaveLength(before)
  })
})

describe('removeStop', () => {
  it('drops the stop and renumbers its day', () => {
    const next = removeStop(seed.stops, 's2')
    expect(next.some((s) => s.id === 's2')).toBe(false)
    expect(ordersFor(next, 1)).toEqual([1, 2, 3])
    expect(namesFor(next, 1)).toEqual([
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
  })

  it('leaves other days untouched', () => {
    const next = removeStop(seed.stops, 's2')
    expect(ordersFor(next, 2)).toEqual([1, 2, 3, 4])
  })

  it('is a no-op for an unknown id', () => {
    expect(removeStop(seed.stops, 'nope')).toHaveLength(seed.stops.length)
  })
})

describe('moveStop', () => {
  it('swaps a stop with its predecessor', () => {
    const next = moveStop(seed.stops, 's2', 'up')
    expect(namesFor(next, 1)).toEqual([
      'Armenian Street murals',
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
    expect(ordersFor(next, 1)).toEqual([1, 2, 3, 4])
  })

  it('swaps a stop with its successor', () => {
    const next = moveStop(seed.stops, 's1', 'down')
    expect(namesFor(next, 1)[0]).toBe('Armenian Street murals')
    expect(namesFor(next, 1)[1]).toBe('Chew Jetty')
  })

  it('is a no-op at the top of a day', () => {
    expect(namesFor(moveStop(seed.stops, 's1', 'up'), 1)).toEqual(namesFor(seed.stops, 1))
  })

  it('is a no-op at the bottom of a day', () => {
    expect(namesFor(moveStop(seed.stops, 's4', 'down'), 1)).toEqual(namesFor(seed.stops, 1))
  })

  it('never moves a stop across days', () => {
    const next = moveStop(seed.stops, 's4', 'down')
    expect(next.find((s) => s.id === 's4')!.day).toBe(1)
    expect(next.filter((s) => s.day === 2)).toHaveLength(4)
  })
})

describe('editStop', () => {
  const asDraft = (id: string): StopDraft => {
    const { id: _id, order: _order, ...rest } = seed.stops.find((s) => s.id === id)!
    return rest
  }

  it('patches fields in place when the day is unchanged', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), name: 'Renamed', costPerPerson: 12 })
    const edited = next.find((s) => s.id === 's2')!
    expect(edited.name).toBe('Renamed')
    expect(edited.costPerPerson).toBe(12)
    expect(edited.order).toBe(2)
    expect(ordersFor(next, 1)).toEqual([1, 2, 3, 4])
  })

  it('closes the gap in the old day when a stop moves day', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), day: 3 })
    expect(ordersFor(next, 1)).toEqual([1, 2, 3])
    expect(namesFor(next, 1)).toEqual([
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
  })

  it('appends to the end of the new day', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), day: 3 })
    const moved = next.find((s) => s.id === 's2')!
    expect(moved.day).toBe(3)
    expect(moved.order).toBe(4)
    expect(ordersFor(next, 3)).toEqual([1, 2, 3, 4])
  })

  it('is a no-op for an unknown id', () => {
    expect(editStop(seed.stops, 'nope', asDraft('s2'))).toEqual(seed.stops)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/stops.test.ts`
Expected: FAIL — `insertStop`, `removeStop`, `moveStop` are not exported.

- [ ] **Step 3: Write the functions**

Append to `src/domain/stops.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/stops.test.ts`
Expected: PASS — 29 tests.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 64 tests.

- [ ] **Step 6: Commit**

```bash
git add src/domain/stops.ts src/domain/__tests__/stops.test.ts
git commit -m "feat: add insert, remove, reorder and day-aware edit for stops"
```

---

### Task 4: Store actions

**Files:**
- Modify: `src/store/tripStore.ts`
- Test: `src/domain/__tests__/tripStore.test.ts`

**Interfaces:**
- Consumes: `insertStop`, `removeStop`, `moveStop`, `editStop`, `StopDraft` from `src/domain/stops.ts`.
- Produces four new actions on `useTripStore`:
  - `addStop(draft: StopDraft): void` — inserts and selects the new stop
  - `deleteStop(id: string): void` — removes, and clears the selection if that stop was selected
  - `moveStop(id: string, direction: 'up' | 'down'): void`
  - `editStop(id: string, draft: StopDraft): void` — day-aware; use this from the form, not `updateStop`

The existing `updateStop` stays for single-field patches that cannot change `day`. Nothing in Phase 2 should call it with a full draft.

- [ ] **Step 1: Write the failing test**

Append to `src/domain/__tests__/tripStore.test.ts`:

```ts
import { DEFAULT_COORDS, type StopDraft } from '../stops'

const draft: StopDraft = {
  day: 1,
  name: 'Penang Botanic Gardens',
  start: '09:00',
  durationMin: 60,
  costPerPerson: 0,
  lat: DEFAULT_COORDS.lat,
  lng: DEFAULT_COORDS.lng,
  category: 'nature',
  serves: ['m3'],
  conflicts: [],
  reason: 'A slow green hour for Mei.',
}

describe('editing actions', () => {
  beforeEach(() => {
    useTripStore.getState().reset()
  })

  it('adds a stop and selects it', () => {
    useTripStore.getState().addStop(draft)
    const state = useTripStore.getState()
    expect(state.stops).toHaveLength(12)
    const added = state.stops.find((s) => s.name === 'Penang Botanic Gardens')!
    expect(added.id).toBe('s12')
    expect(state.selectedNodeId).toBe('s12')
  })

  it('persists an added stop', () => {
    useTripStore.getState().addStop(draft)
    expect(localStorage.getItem('travel-planner')).toContain('Penang Botanic Gardens')
  })

  it('deletes a stop and renumbers its day', () => {
    useTripStore.getState().deleteStop('s2')
    const stops = useTripStore.getState().stops
    expect(stops).toHaveLength(10)
    expect(stops.filter((s) => s.day === 1).map((s) => s.order).sort()).toEqual([1, 2, 3])
  })

  it('clears the selection when the selected stop is deleted', () => {
    useTripStore.getState().select('s2')
    useTripStore.getState().deleteStop('s2')
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('leaves an unrelated selection alone when deleting', () => {
    useTripStore.getState().select('s7')
    useTripStore.getState().deleteStop('s2')
    expect(useTripStore.getState().selectedNodeId).toBe('s7')
  })

  it('reorders within a day', () => {
    useTripStore.getState().moveStop('s2', 'up')
    const day1 = useTripStore.getState().stops
      .filter((s) => s.day === 1)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id)
    expect(day1).toEqual(['s2', 's1', 's3', 's4'])
  })

  it('edits a stop in place', () => {
    const s2 = useTripStore.getState().stops.find((s) => s.id === 's2')!
    const { id: _id, order: _order, ...rest } = s2
    useTripStore.getState().editStop('s2', { ...rest, name: 'Renamed' })
    expect(useTripStore.getState().stops.find((s) => s.id === 's2')!.name).toBe('Renamed')
  })

  it('keeps both days contiguous when an edit moves a stop to another day', () => {
    const s2 = useTripStore.getState().stops.find((s) => s.id === 's2')!
    const { id: _id, order: _order, ...rest } = s2
    useTripStore.getState().editStop('s2', { ...rest, day: 3 })
    const stops = useTripStore.getState().stops
    const orders = (day: number) =>
      stops.filter((s) => s.day === day).map((s) => s.order).sort((a, b) => a - b)
    expect(orders(1)).toEqual([1, 2, 3])
    expect(orders(3)).toEqual([1, 2, 3, 4])
    expect(stops.find((s) => s.id === 's2')!.day).toBe(3)
  })

  it('restores the seed on reset after edits', () => {
    useTripStore.getState().addStop(draft)
    useTripStore.getState().deleteStop('s1')
    useTripStore.getState().reset()
    expect(useTripStore.getState().stops).toHaveLength(11)
    expect(useTripStore.getState().stops.find((s) => s.id === 's1')!.name).toBe('Chew Jetty')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/tripStore.test.ts`
Expected: FAIL — `addStop is not a function`.

- [ ] **Step 3: Add the actions**

In `src/store/tripStore.ts`, extend the imports:

```ts
import {
  editStop as editStopIn,
  insertStop,
  moveStop as moveStopIn,
  removeStop,
  type StopDraft,
} from '../domain/stops'
```

Add to the `TripStore` interface, after `updateStop`:

```ts
  addStop: (draft: StopDraft) => void
  deleteStop: (id: string) => void
  moveStop: (id: string, direction: 'up' | 'down') => void
  editStop: (id: string, draft: StopDraft) => void
```

Add to the store body, after the `updateStop` action:

```ts
      addStop: (draft) =>
        set((state) => {
          const stops = insertStop(state.stops, draft)
          const added = stops.find((s) => !state.stops.some((old) => old.id === s.id))
          return { stops, selectedNodeId: added ? added.id : state.selectedNodeId }
        }),
      deleteStop: (id) =>
        set((state) => ({
          stops: removeStop(state.stops, id),
          // A drawer showing a stop that no longer exists would render blank.
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),
      moveStop: (id, direction) =>
        set((state) => ({ stops: moveStopIn(state.stops, id, direction) })),
      editStop: (id, draft) =>
        set((state) => ({ stops: editStopIn(state.stops, id, draft) })),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/tripStore.test.ts`
Expected: PASS — 18 tests (9 existing + 9 new).

- [ ] **Step 5: Run the full suite and build**

Run: `npm test && npm run build`
Expected: 73 tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/store/tripStore.ts src/domain/__tests__/tripStore.test.ts
git commit -m "feat: add addStop, deleteStop, moveStop and editStop actions"
```

---

### Task 5: The stop form

One controlled form serving both the edit drawer (Task 6) and the add modal (Task 7).

**Files:**
- Create: `src/components/StopForm.tsx`

**Interfaces:**
- Consumes: `StopDraft`, `validateStop`, `DEFAULT_COORDS` from `src/domain/stops.ts`; `useTripStore` for members and trip.
- Produces:
  ```ts
  export function StopForm(props: {
    initial?: Partial<StopDraft>
    submitLabel: string
    onSubmit: (draft: StopDraft) => void
    onCancel?: () => void
  }): JSX.Element
  ```
  It owns its draft state, validates on submit, and only calls `onSubmit` when `validateStop` returns no errors.

- [ ] **Step 1: Write the component**

Create `src/components/StopForm.tsx`:

```tsx
import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import type { StopCategory } from '../domain/types'
import { DEFAULT_COORDS, validateStop, type StopDraft } from '../domain/stops'
import { useTripStore } from '../store/tripStore'

const CATEGORIES: StopCategory[] = ['food', 'sight', 'nature', 'cafe', 'market']

function blankDraft(initial?: Partial<StopDraft>): StopDraft {
  return {
    day: 1,
    name: '',
    start: '09:00',
    durationMin: 60,
    costPerPerson: 0,
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,
    category: 'sight',
    serves: [],
    conflicts: [],
    reason: '',
    ...initial,
  }
}

export function StopForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<StopDraft>
  submitLabel: string
  onSubmit: (draft: StopDraft) => void
  onCancel?: () => void
}) {
  const members = useTripStore((s) => s.members)
  const days = useTripStore((s) => s.trip.days)
  const currency = useTripStore((s) => s.trip.currency)

  const [draft, setDraft] = useState<StopDraft>(() => blankDraft(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof StopDraft>(key: K, value: StopDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }))

  const submit = () => {
    const found = validateStop(draft, days)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(draft)
  }

  return (
    <Stack gap="sm">
      <TextInput
        label="Name"
        value={draft.name}
        error={errors.name}
        onChange={(e) => set('name', e.currentTarget.value)}
      />
      <Group grow>
        <NumberInput
          label="Day"
          min={1}
          max={days}
          value={draft.day}
          error={errors.day}
          onChange={(v) => set('day', typeof v === 'number' ? v : 1)}
        />
        <TextInput
          label="Start"
          placeholder="09:30"
          value={draft.start}
          error={errors.start}
          onChange={(e) => set('start', e.currentTarget.value)}
        />
      </Group>
      <Group grow>
        <NumberInput
          label="Minutes"
          min={1}
          value={draft.durationMin}
          error={errors.durationMin}
          onChange={(v) => set('durationMin', typeof v === 'number' ? v : 0)}
        />
        <NumberInput
          label={`Cost (${currency})`}
          min={0}
          value={draft.costPerPerson}
          error={errors.costPerPerson}
          onChange={(v) => set('costPerPerson', typeof v === 'number' ? v : 0)}
        />
      </Group>
      <Select
        label="Kind"
        data={CATEGORIES.map((c) => ({ value: c, label: c }))}
        value={draft.category}
        onChange={(v) => set('category', (v ?? 'sight') as StopCategory)}
      />
      <MultiSelect
        label="Planned for"
        data={memberOptions}
        value={draft.serves}
        error={errors.serves}
        onChange={(v) => set('serves', v)}
      />
      <MultiSelect
        label="At the cost of"
        data={memberOptions}
        value={draft.conflicts}
        error={errors.conflicts}
        onChange={(v) => set('conflicts', v)}
      />
      <Textarea
        label="Why"
        autosize
        minRows={2}
        value={draft.reason}
        onChange={(e) => set('reason', e.currentTarget.value)}
      />
      <Group justify="flex-end" gap="xs" mt="xs">
        {onCancel && (
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={submit}>{submitLabel}</Button>
      </Group>
    </Stack>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Run the suite to confirm nothing broke**

Run: `npm test`
Expected: PASS — 73 tests, unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/StopForm.tsx
git commit -m "feat: add the stop form"
```

---

### Task 6: Editable stop drawer

**Files:**
- Modify: `src/components/NodeDrawer.tsx`

**Interfaces:**
- Consumes: `StopForm` from Task 5; `editStop`, `deleteStop`, `moveStop` from the store. **Use `editStop`, not `updateStop`** — the form can change `day`, and only `editStop` renumbers both days.
- Produces: no new exports. `StopBody` gains an edit mode, a delete action and reorder controls.

- [ ] **Step 1: Rewrite `StopBody` and its call site**

In `src/components/NodeDrawer.tsx`, add to the imports:

```tsx
import { useState } from 'react'
import { Button, Divider } from '@mantine/core'
import { StopForm } from './StopForm'
import type { StopDraft } from '../domain/stops'
```

Replace the whole `StopBody` function with:

```tsx
function StopBody({ stop, currency }: { stop: Stop; currency: string }) {
  const [editing, setEditing] = useState(false)
  const editStop = useTripStore((s) => s.editStop)
  const deleteStop = useTripStore((s) => s.deleteStop)
  const moveStop = useTripStore((s) => s.moveStop)

  if (editing) {
    return (
      <StopForm
        // Remounts the form when a different stop is opened, so the fields
        // never show the previous stop's values.
        key={stop.id}
        initial={stop}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={(draft: StopDraft) => {
          editStop(stop.id, draft)
          setEditing(false)
        }}
      />
    )
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Day {stop.day} · {stop.start}–{endTime(stop.start, stop.durationMin)} ·{' '}
        {stop.durationMin} min · {currency} {stop.costPerPerson} per person
      </Text>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Planned for</Text>
        <MemberBadges ids={stop.serves} />
      </div>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>At the cost of</Text>
        <MemberBadges ids={stop.conflicts} />
        {stop.conflicts.length > 0 && <Text size="sm" mt="sm">{stop.reason}</Text>}
      </div>

      <Divider my="xs" />

      <Group gap="xs">
        <Button size="xs" variant="default" onClick={() => moveStop(stop.id, 'up')}>
          Move up
        </Button>
        <Button size="xs" variant="default" onClick={() => moveStop(stop.id, 'down')}>
          Move down
        </Button>
      </Group>
      <Group gap="xs">
        <Button size="xs" onClick={() => setEditing(true)}>Edit</Button>
        <Button size="xs" color="red" variant="light" onClick={() => deleteStop(stop.id)}>
          Delete
        </Button>
      </Group>
    </Stack>
  )
}
```

Note: `deleteStop` clears the selection when the deleted stop was the selected one (Task 4), so the drawer closes on its own. Do not add a manual `select(null)` here.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Run the suite and build**

Run: `npm test && npm run build`
Expected: 73 tests pass; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/NodeDrawer.tsx
git commit -m "feat: make the stop drawer editable"
```

---

### Task 7: Add a stop

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `StopForm` from Task 5; `addStop` from the store.
- Produces: no new exports. The header gains an "Add stop" button opening a modal.

- [ ] **Step 1: Add the modal and button**

In `src/components/Header.tsx`, extend the imports:

```tsx
import { useState } from 'react'
import { Button, Group, Modal, SegmentedControl, Text } from '@mantine/core'
import { StopForm } from './StopForm'
```

Inside the `Header` component, before the `return`:

```tsx
  const addStop = useTripStore((s) => s.addStop)
  const [adding, setAdding] = useState(false)
```

Add the button to the right-hand `Group`, before the Reset button:

```tsx
        <Button size="xs" onClick={() => setAdding(true)}>Add stop</Button>
```

And render the modal as a sibling of the header `Group` — wrap the existing return in a fragment:

```tsx
      <Modal opened={adding} onClose={() => setAdding(false)} title="Add a stop" size="md">
        <StopForm
          // Fresh fields every time the modal opens rather than whatever was
          // half-typed last time.
          key={adding ? 'open' : 'closed'}
          submitLabel="Add stop"
          onCancel={() => setAdding(false)}
          onSubmit={(draft) => {
            addStop(draft)
            setAdding(false)
          }}
        />
      </Modal>
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Run the suite and build**

Run: `npm test && npm run build`
Expected: 73 tests pass; build succeeds.

- [ ] **Step 4: Browser verification**

This step is the controller's, not the implementer's — the Chrome tooling is bound to the controller session. Run `npm run dev` and confirm:

1. "Add stop" opens a modal; submitting with a blank name and nobody in "Planned for" shows inline errors and does not close.
2. A valid submission closes the modal, adds a node to the map, and opens its drawer.
3. Editing a stop's name from the drawer updates the node label on the map.
4. "Move up"/"Move down" reorder within the day and are no-ops at the ends.
5. Delete removes the node and closes the drawer.
6. Reload: added, edited and reordered stops all survive.
7. "Reset trip" restores the original 11 stops.
8. Deleting every stop of a day leaves the Itinerary category node in sequence, not on the centreline (Task 1's fix, observed rather than asserted).
9. Editing a stop's **day** in the form moves it to the end of the new day and closes the gap in the old one — no duplicated or skipped positions in either. This is the case `editStop` exists for, and the one most likely to look wrong on screen if it regressed.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add a stop from the header"
```

---

## Phase 2 exit criteria

- `npm test` passes with 73 tests across 6 files.
- `npm run build` succeeds.
- The Task 7 Step 4 browser checklist passes end to end.
- Stop `order` remains contiguous from 1 within every day after any sequence of add, delete and move.

## Deferred to later phases

| Phase | Content |
|---|---|
| 3 | Bookings and budget overlays, settlement suggestions |
| 4 | `itinerary.ts` and `people.ts` lens builders; re-enable the switcher and restore `lens` to `partialize` |
| 5 | Leaflet map overlay; replace `DEFAULT_COORDS` with map-picking |
| 6 | `ai/explain.ts`, settings modal, key handling, caching, fallbacks |
| 7 | `scoring.ts`, `planner.ts`, `disruption.ts` — real re-planning — plus demo polish |
