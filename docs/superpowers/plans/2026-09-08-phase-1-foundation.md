# Mindmap Travel Planner — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current read-only demo prop with the foundation of the real planner — typed domain model, seeded Penang fixture, persisted store, the category lens, and a mindmap shell whose nodes open detail drawers.

**Architecture:** The mindmap is the application shell — one screen, always. Pure domain logic lives in `src/domain/` with no React. Each lens is a pure function from state to React Flow nodes/edges in `src/graph/`. Zustand holds state and persists it to localStorage.

**Tech Stack:** Vite 8, React 19, TypeScript, `@xyflow/react` v12, Tailwind CSS v4, Mantine 9 (unpinned install resolved to 9.x; the binding requirement is the `styles.layer.css` build, which 9.x provides), Zustand, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-08-mindmap-travel-planner-design.md`

## Global Constraints

- No backend, no database, no auth, no real booking/pricing APIs.
- No router dependency — the shell is a single screen.
- No API key may ever be committed to the repository.
- Desktop browser only. No mobile or PWA work.
- Persistence is `localStorage` only, via Zustand's `persist` middleware.
- Mantine styles MUST be imported as `styles.layer.css` (the `@layer mantine` build) so Tailwind utilities win without specificity hacks. Never import both `styles.css` and `styles.layer.css`.
- Field naming: `color` (not `colour`) throughout code, matching CSS/JS convention.
- Existing `src/TripMap.tsx`, `src/TripMap.css`, `src/data/trip.json` and `src/data/trip_delayed.json` are superseded and deleted in Task 7.

---

### Task 1: Toolchain — Tailwind v4, Mantine, Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `postcss.config.cjs`
- Modify: `src/index.css`
- Modify: `src/main.tsx`
- Create: `src/domain/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` (Vitest, jsdom environment), Tailwind utilities available in JSX, and `<MantineProvider>` wrapping the app.

- [ ] **Step 1: Install dependencies**

```bash
npm install @mantine/core @mantine/hooks zustand
npm install -D tailwindcss @tailwindcss/vite postcss postcss-preset-mantine postcss-simple-vars vitest jsdom
```

- [ ] **Step 2: Write the failing smoke test**

Create `src/domain/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs and has a DOM', () => {
    expect(typeof document).toBe('object')
    expect(localStorage).toBeDefined()
  })
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/smoke.test.ts`
Expected: FAIL — no `test` config yet, so `document` is undefined under the default `node` environment.

- [ ] **Step 4: Configure Vite, Vitest and Tailwind**

Replace `vite.config.ts` entirely:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

Add the test scripts to `package.json` (keep the existing `dev`, `build`, `lint`, `preview` entries):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Configure PostCSS for Mantine**

Create `postcss.config.cjs`:

```js
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
}
```

- [ ] **Step 6: Set the CSS layer order**

Replace `src/index.css` entirely. The `@layer` statement must come before `@import`, and it declares `mantine` first so Tailwind's layers sort above it:

```css
@layer mantine, theme, base, components, utilities;

@import "tailwindcss";

html,
body,
#root {
  height: 100%;
  margin: 0;
}
```

- [ ] **Step 7: Wire MantineProvider**

Replace `src/main.tsx` entirely. Mantine's layered stylesheet is imported before `index.css`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.layer.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
)
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 1 test.

- [ ] **Step 9: Verify the build still works**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts postcss.config.cjs src/index.css src/main.tsx src/domain/__tests__/smoke.test.ts
git commit -m "chore: add Tailwind v4, Mantine and Vitest toolchain"
```

---

### Task 2: Domain types

**Files:**
- Create: `src/domain/types.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Trip`, `Member`, `Stop`, `Booking`, `Expense`, `TripState`, `MemberId`, `Pace`, `StopCategory`, `LensId`. Every later task imports from here.

- [ ] **Step 1: Write the types**

Create `src/domain/types.ts`:

```ts
export type MemberId = string
export type Pace = 'relaxed' | 'packed'
export type StopCategory = 'food' | 'sight' | 'nature' | 'cafe' | 'market'
export type LensId = 'categories' | 'itinerary' | 'people'

export interface Trip {
  id: string
  destination: string
  startDate: string
  days: number
  currency: string
  budgetPerPerson: number
}

export interface Member {
  id: MemberId
  name: string
  color: string
  budgetCap: number
  pace: Pace
  must: string[]
  avoid: string[]
}

export interface Stop {
  id: string
  day: number
  order: number
  name: string
  start: string
  durationMin: number
  costPerPerson: number
  lat: number
  lng: number
  category: StopCategory
  serves: MemberId[]
  conflicts: MemberId[]
  reason: string
}

export interface Booking {
  id: string
  type: 'flight' | 'stay'
  title: string
  ref: string
  start: string
  end: string
  cost: number
  affectsDay: number
}

export interface Expense {
  id: string
  sourceId: string
  paidBy: MemberId
  amount: number
  splitAmong: MemberId[]
}

export interface TripState {
  trip: Trip
  members: Member[]
  stops: Stop[]
  bookings: Booking[]
  expenses: Expense[]
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat: add domain types"
```

---

### Task 3: Seed fixture with integrity tests

Carries the existing Penang content forward, adding coordinates and categories. Tests assert the fixture is internally consistent — this catches typos in member ids that would otherwise surface as blank chips in the UI.

**Files:**
- Create: `src/store/seed.ts`
- Test: `src/domain/__tests__/seed.test.ts`

**Interfaces:**
- Consumes: `TripState`, `Stop`, `Member` from `src/domain/types.ts`.
- Produces: `export const seed: TripState`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { seed } from '../../store/seed'

const memberIds = new Set(seed.members.map((m) => m.id))

describe('seed fixture', () => {
  it('has four members and at least ten stops', () => {
    expect(seed.members).toHaveLength(4)
    expect(seed.stops.length).toBeGreaterThanOrEqual(10)
  })

  it('references only real member ids in serves and conflicts', () => {
    for (const stop of seed.stops) {
      for (const id of [...stop.serves, ...stop.conflicts]) {
        expect(memberIds.has(id)).toBe(true)
      }
    }
  })

  it('never lists a member as both served and conflicted on one stop', () => {
    for (const stop of seed.stops) {
      const overlap = stop.serves.filter((id) => stop.conflicts.includes(id))
      expect(overlap).toEqual([])
    }
  })

  it('serves at least one member per stop', () => {
    for (const stop of seed.stops) {
      expect(stop.serves.length).toBeGreaterThan(0)
    }
  })

  it('places every stop inside Penang', () => {
    for (const stop of seed.stops) {
      expect(stop.lat).toBeGreaterThan(5.2)
      expect(stop.lat).toBeLessThan(5.6)
      expect(stop.lng).toBeGreaterThan(100.1)
      expect(stop.lng).toBeLessThan(100.6)
    }
  })

  it('numbers stop orders contiguously from 1 within each day', () => {
    for (let day = 1; day <= seed.trip.days; day++) {
      const orders = seed.stops
        .filter((s) => s.day === day)
        .map((s) => s.order)
        .sort((a, b) => a - b)
      expect(orders).toEqual(orders.map((_, i) => i + 1))
    }
  })

  it('gives every member at least one stop they are served by and one they lose out on', () => {
    for (const member of seed.members) {
      expect(seed.stops.some((s) => s.serves.includes(member.id))).toBe(true)
      expect(seed.stops.some((s) => s.conflicts.includes(member.id))).toBe(true)
    }
  })

  it('links every booking and expense to a real day and member', () => {
    for (const booking of seed.bookings) {
      expect(booking.affectsDay).toBeGreaterThanOrEqual(1)
      expect(booking.affectsDay).toBeLessThanOrEqual(seed.trip.days)
    }
    for (const expense of seed.expenses) {
      expect(memberIds.has(expense.paidBy)).toBe(true)
      for (const id of expense.splitAmong) expect(memberIds.has(id)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/seed.test.ts`
Expected: FAIL — cannot resolve `../../store/seed`.

- [ ] **Step 3: Write the seed fixture**

Create `src/store/seed.ts`:

```ts
import type { TripState } from '../domain/types'

export const seed: TripState = {
  trip: {
    id: 'penang-2026',
    destination: 'Penang',
    startDate: '2026-10-02',
    days: 3,
    currency: 'MYR',
    budgetPerPerson: 450,
  },
  members: [
    { id: 'm1', name: 'Yap', color: '#3B82F6', budgetCap: 500, pace: 'relaxed', must: ['street food'], avoid: ['hiking'] },
    { id: 'm2', name: 'Wei', color: '#F59E0B', budgetCap: 300, pace: 'packed', must: ['photo spots'], avoid: [] },
    { id: 'm3', name: 'Mei', color: '#10B981', budgetCap: 600, pace: 'relaxed', must: ['cafes'], avoid: ['seafood'] },
    { id: 'm4', name: 'Ali', color: '#8B5CF6', budgetCap: 400, pace: 'packed', must: [], avoid: ['pork'] },
  ],
  stops: [
    {
      id: 's1', day: 1, order: 1, name: 'Chew Jetty', start: '16:00', durationMin: 75,
      costPerPerson: 0, lat: 5.4141, lng: 100.3416, category: 'sight',
      serves: ['m2'], conflicts: ['m3'],
      reason: 'Wei gets the stilt houses in late afternoon light. There is nowhere to sit down for coffee out here, which is what Mei asked for.',
    },
    {
      id: 's2', day: 1, order: 2, name: 'Armenian Street murals', start: '17:45', durationMin: 60,
      costPerPerson: 0, lat: 5.4171, lng: 100.3380, category: 'sight',
      serves: ['m2', 'm3'], conflicts: ['m4'],
      reason: 'The murals are Wei’s shot and the coffee shops along the street cover Mei. It is a slow wander, and Ali would rather keep moving.',
    },
    {
      id: 's3', day: 1, order: 3, name: 'Chulia Street night market', start: '19:30', durationMin: 90,
      costPerPerson: 25, lat: 5.4183, lng: 100.3355, category: 'market',
      serves: ['m1', 'm2'], conflicts: ['m4'],
      reason: 'Covers Yap’s street food and Wei’s photo spots. Ali avoids pork, so his options here are limited.',
    },
    {
      id: 's4', day: 1, order: 4, name: 'Gurney Drive hawker centre', start: '21:30', durationMin: 75,
      costPerPerson: 30, lat: 5.4372, lng: 100.3095, category: 'food',
      serves: ['m1', 'm4'], conflicts: ['m3'],
      reason: 'More street food for Yap, and the halal stalls here work for Ali. Most of what Gurney is famous for is seafood, which Mei avoids.',
    },
    {
      id: 's5', day: 2, order: 1, name: 'Line Clear Nasi Kandar', start: '08:30', durationMin: 45,
      costPerPerson: 15, lat: 5.4189, lng: 100.3320, category: 'food',
      serves: ['m1'], conflicts: ['m3'],
      reason: 'Yap’s pick, and the best nasi kandar on the island. It is a standing-room alley, not the slow breakfast Mei wanted to start with.',
    },
    {
      id: 's6', day: 2, order: 2, name: 'Kek Lok Si Temple', start: '10:00', durationMin: 120,
      costPerPerson: 12, lat: 5.3993, lng: 100.2735, category: 'sight',
      serves: ['m2', 'm4'], conflicts: ['m1'],
      reason: 'The pagoda tiers are the best frame Wei will get all trip, and the pace suits Ali. Getting up there is a long climb, and Yap avoids hiking.',
    },
    {
      id: 's7', day: 2, order: 3, name: 'Penang Hill funicular', start: '13:00', durationMin: 150,
      costPerPerson: 30, lat: 5.4239, lng: 100.2686, category: 'nature',
      serves: ['m2', 'm4'], conflicts: ['m1', 'm3'],
      reason: 'Wei gets the island panorama and Ali gets a full afternoon. There is a lot of walking at the top for Yap, and it takes the whole afternoon Mei had earmarked for cafes.',
    },
    {
      id: 's8', day: 2, order: 4, name: 'China House', start: '16:30', durationMin: 90,
      costPerPerson: 35, lat: 5.4157, lng: 100.3400, category: 'cafe',
      serves: ['m3', 'm1'], conflicts: ['m2'],
      reason: 'Mei’s cafe stop, and the cake counter is worth the detour for Yap too. It runs through the last of the good light, so Wei shoots nothing.',
    },
    {
      id: 's9', day: 3, order: 1, name: 'Batu Ferringhi beach', start: '09:30', durationMin: 120,
      costPerPerson: 0, lat: 5.4750, lng: 100.2500, category: 'nature',
      serves: ['m3', 'm2'], conflicts: ['m4'],
      reason: 'A slow morning for Mei with the coastline for Wei. It is a soft start to the day, and Ali would rather have packed something in.',
    },
    {
      id: 's10', day: 3, order: 2, name: 'Tropical Spice Garden', start: '12:00', durationMin: 90,
      costPerPerson: 28, lat: 5.4620, lng: 100.2450, category: 'nature',
      serves: ['m3', 'm4'], conflicts: ['m1'],
      reason: 'Shaded garden trails suit Mei, and it gives Ali a real stop rather than a photo pause. The trails climb, which Yap avoids.',
    },
    {
      id: 's11', day: 3, order: 3, name: 'Kimberley Street food street', start: '18:30', durationMin: 90,
      costPerPerson: 22, lat: 5.4166, lng: 100.3345, category: 'market',
      serves: ['m1', 'm4'], conflicts: ['m2'],
      reason: 'Yap’s last street food run, with enough non-pork stalls to keep Ali fed. It is dark and cramped, so there is little here for Wei to shoot.',
    },
  ],
  bookings: [
    {
      id: 'b1', type: 'flight', title: 'MH1234 KUL to PEN', ref: 'MH1234',
      start: '2026-10-02T12:30:00', end: '2026-10-02T13:35:00', cost: 180, affectsDay: 1,
    },
    {
      id: 'b2', type: 'stay', title: 'Chulia Heritage Hotel', ref: 'CHH-88421',
      start: '2026-10-02T15:00:00', end: '2026-10-05T12:00:00', cost: 260, affectsDay: 1,
    },
    {
      id: 'b3', type: 'flight', title: 'MH1247 PEN to KUL', ref: 'MH1247',
      start: '2026-10-05T14:10:00', end: '2026-10-05T15:15:00', cost: 180, affectsDay: 3,
    },
  ],
  expenses: [
    { id: 'e1', sourceId: 'b2', paidBy: 'm2', amount: 1040, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
    { id: 'e2', sourceId: 's4', paidBy: 'm1', amount: 120, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
    { id: 'e3', sourceId: 's7', paidBy: 'm3', amount: 120, splitAmong: ['m1', 'm2', 'm3', 'm4'] },
  ],
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/seed.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/seed.ts src/domain/__tests__/seed.test.ts
git commit -m "feat: add seeded Penang fixture with integrity tests"
```

---

### Task 4: Persisted store

**Files:**
- Create: `src/store/tripStore.ts`
- Test: `src/domain/__tests__/tripStore.test.ts`

**Interfaces:**
- Consumes: `seed` from `src/store/seed.ts`; `Stop`, `TripState`, `LensId` from `src/domain/types.ts`.
- Produces: `useTripStore` (Zustand hook) with state `{ ...TripState, lens, selectedNodeId }` and actions `setLens(lens)`, `select(id)`, `updateStop(id, patch)`, `reset()`. Persisted under localStorage key `travel-planner`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/tripStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useTripStore } from '../../store/tripStore'

describe('trip store', () => {
  beforeEach(() => {
    useTripStore.getState().reset()
  })

  it('starts from the seed fixture', () => {
    expect(useTripStore.getState().trip.destination).toBe('Penang')
    expect(useTripStore.getState().stops).toHaveLength(11)
  })

  it('defaults to the categories lens with nothing selected', () => {
    expect(useTripStore.getState().lens).toBe('categories')
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('switches lens', () => {
    useTripStore.getState().setLens('people')
    expect(useTripStore.getState().lens).toBe('people')
  })

  it('selects and clears a node', () => {
    useTripStore.getState().select('s3')
    expect(useTripStore.getState().selectedNodeId).toBe('s3')
    useTripStore.getState().select(null)
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('patches a single stop without touching the others', () => {
    useTripStore.getState().updateStop('s3', { name: 'Renamed', costPerPerson: 99 })
    const stops = useTripStore.getState().stops
    const changed = stops.find((s) => s.id === 's3')!
    expect(changed.name).toBe('Renamed')
    expect(changed.costPerPerson).toBe(99)
    expect(changed.start).toBe('19:30')
    expect(stops.find((s) => s.id === 's4')!.name).toBe('Gurney Drive hawker centre')
  })

  it('restores the seed on reset', () => {
    useTripStore.getState().updateStop('s3', { name: 'Renamed' })
    useTripStore.getState().reset()
    expect(useTripStore.getState().stops.find((s) => s.id === 's3')!.name)
      .toBe('Chulia Street night market')
  })

  it('writes to localStorage under the travel-planner key', () => {
    useTripStore.getState().updateStop('s3', { name: 'Persisted' })
    expect(localStorage.getItem('travel-planner')).toContain('Persisted')
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/tripStore.test.ts`
Expected: FAIL — cannot resolve `../../store/tripStore`.

- [ ] **Step 3: Write the store**

Create `src/store/tripStore.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LensId, Stop, TripState } from '../domain/types'
import { seed } from './seed'

interface TripStore extends TripState {
  lens: LensId
  selectedNodeId: string | null
  setLens: (lens: LensId) => void
  select: (id: string | null) => void
  updateStop: (id: string, patch: Partial<Stop>) => void
  reset: () => void
}

const initial = () => ({
  ...structuredClone(seed),
  lens: 'categories' as LensId,
  selectedNodeId: null,
})

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      ...initial(),
      setLens: (lens) => set({ lens }),
      select: (selectedNodeId) => set({ selectedNodeId }),
      updateStop: (id, patch) =>
        set((state) => ({
          stops: state.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      reset: () => set(initial()),
    }),
    { name: 'travel-planner' },
  ),
)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/tripStore.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/tripStore.ts src/domain/__tests__/tripStore.test.ts
git commit -m "feat: add persisted trip store"
```

---

### Task 5: Category lens graph builder

**Files:**
- Create: `src/graph/types.ts`
- Create: `src/graph/layout.ts`
- Create: `src/graph/categories.ts`
- Test: `src/domain/__tests__/categories.test.ts`

**Interfaces:**
- Consumes: `TripState` from `src/domain/types.ts`.
- Produces:
  - `src/graph/types.ts`: `export type MapNodeKind = 'trip' | 'category' | 'stop' | 'booking' | 'budget' | 'member'`; `export interface Graph { nodes: Node[]; edges: Edge[] }`; `export type CategoryId = 'itinerary' | 'bookings' | 'budget' | 'people'`.
  - `src/graph/layout.ts`: `export function column(count: number, rowHeight?: number): number[]` returning `count` y positions centred on 0, spaced `rowHeight` apart (default 96).
  - `src/graph/categories.ts`: `export function buildCategoriesGraph(state: TripState): Graph`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/__tests__/categories.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildCategoriesGraph } from '../../graph/categories'
import { seed } from '../../store/seed'

const graph = buildCategoriesGraph(seed)
const ids = new Set(graph.nodes.map((n) => n.id))

describe('categories lens', () => {
  it('has exactly one trip node', () => {
    expect(graph.nodes.filter((n) => n.type === 'trip')).toHaveLength(1)
  })

  it('has the four category nodes', () => {
    const categories = graph.nodes.filter((n) => n.type === 'category').map((n) => n.id)
    expect(categories.sort()).toEqual(
      ['cat-bookings', 'cat-budget', 'cat-itinerary', 'cat-people'].sort(),
    )
  })

  it('includes a node for every stop, booking and member', () => {
    for (const stop of seed.stops) expect(ids.has(stop.id)).toBe(true)
    for (const booking of seed.bookings) expect(ids.has(booking.id)).toBe(true)
    for (const member of seed.members) expect(ids.has(member.id)).toBe(true)
  })

  it('connects every category to the trip node', () => {
    for (const id of ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people']) {
      expect(graph.edges.some((e) => e.source === 'trip' && e.target === id)).toBe(true)
    }
  })

  it('parents every stop to the itinerary category', () => {
    for (const stop of seed.stops) {
      expect(graph.edges.some((e) => e.source === 'cat-itinerary' && e.target === stop.id)).toBe(true)
    }
  })

  it('gives every edge endpoints that exist', () => {
    for (const edge of graph.edges) {
      expect(ids.has(edge.source)).toBe(true)
      expect(ids.has(edge.target)).toBe(true)
    }
  })

  it('gives every node a unique id', () => {
    expect(ids.size).toBe(graph.nodes.length)
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/domain/__tests__/categories.test.ts`
Expected: FAIL — cannot resolve `../../graph/categories`.

- [ ] **Step 3: Write the shared graph types**

Create `src/graph/types.ts`:

```ts
import type { Edge, Node } from '@xyflow/react'

export type MapNodeKind = 'trip' | 'category' | 'stop' | 'booking' | 'budget' | 'member'
export type CategoryId = 'itinerary' | 'bookings' | 'budget' | 'people'

export interface Graph {
  nodes: Node[]
  edges: Edge[]
}
```

- [ ] **Step 4: Write the layout helper**

Create `src/graph/layout.ts`:

```ts
export function column(count: number, rowHeight = 96): number[] {
  const span = (count - 1) * rowHeight
  return Array.from({ length: count }, (_, i) => i * rowHeight - span / 2)
}
```

- [ ] **Step 5: Write the category builder**

Create `src/graph/categories.ts`:

```ts
import type { Edge, Node } from '@xyflow/react'
import type { TripState } from '../domain/types'
import { column } from './layout'
import type { CategoryId, Graph } from './types'

const COL_TRIP = 0
const COL_CATEGORY = 320
const COL_LEAF = 660

export function buildCategoriesGraph(state: TripState): Graph {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const groups: { id: CategoryId; label: string; leaves: Node[] }[] = [
    {
      id: 'itinerary',
      label: 'Itinerary',
      leaves: state.stops.map((stop) => ({
        id: stop.id,
        type: 'stop',
        position: { x: 0, y: 0 },
        data: { stop },
      })),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      leaves: state.bookings.map((booking) => ({
        id: booking.id,
        type: 'booking',
        position: { x: 0, y: 0 },
        data: { booking },
      })),
    },
    {
      id: 'budget',
      label: 'Budget',
      leaves: state.expenses.map((expense) => ({
        id: expense.id,
        type: 'budget',
        position: { x: 0, y: 0 },
        data: { expense },
      })),
    },
    {
      id: 'people',
      label: 'People',
      leaves: state.members.map((member) => ({
        id: member.id,
        type: 'member',
        position: { x: 0, y: 0 },
        data: { member },
      })),
    },
  ]

  const totalLeaves = groups.reduce((sum, g) => sum + g.leaves.length, 0)
  const leafY = column(totalLeaves)
  let cursor = 0
  const categoryY: number[] = []

  for (const group of groups) {
    const first = cursor
    for (const leaf of group.leaves) {
      leaf.position = { x: COL_LEAF, y: leafY[cursor] }
      nodes.push(leaf)
      edges.push({
        id: `cat-${group.id}--${leaf.id}`,
        source: `cat-${group.id}`,
        target: leaf.id,
        type: 'smoothstep',
      })
      cursor += 1
    }
    const centre = group.leaves.length
      ? (leafY[first] + leafY[cursor - 1]) / 2
      : 0
    categoryY.push(centre)
    nodes.push({
      id: `cat-${group.id}`,
      type: 'category',
      position: { x: COL_CATEGORY, y: centre },
      data: { categoryId: group.id, label: group.label, count: group.leaves.length },
    })
    edges.push({
      id: `trip--cat-${group.id}`,
      source: 'trip',
      target: `cat-${group.id}`,
      type: 'smoothstep',
    })
  }

  nodes.push({
    id: 'trip',
    type: 'trip',
    position: { x: COL_TRIP, y: (categoryY[0] + categoryY[categoryY.length - 1]) / 2 },
    data: { trip: state.trip, memberCount: state.members.length },
  })

  return { nodes, edges }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/domain/__tests__/categories.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add src/graph src/domain/__tests__/categories.test.ts
git commit -m "feat: add category lens graph builder"
```

---

### Task 6: Node components

**Files:**
- Create: `src/components/nodes/nodeTypes.tsx`

**Interfaces:**
- Consumes: `Stop`, `Booking`, `Member`, `Expense`, `Trip` from `src/domain/types.ts`; store from `src/store/tripStore.ts` (for member colour lookup).
- Produces: `export const nodeTypes` — a React Flow `nodeTypes` map with keys `trip`, `category`, `stop`, `booking`, `budget`, `member`.

- [ ] **Step 1: Write the node components**

Create `src/components/nodes/nodeTypes.tsx`. Stop fill uses the stacked left-band treatment proven in the browser this session — one band segment per served member:

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Booking, Expense, Member, Stop, Trip } from '../../domain/types'
import { useTripStore } from '../../store/tripStore'

function useMemberColors(ids: string[]) {
  const members = useTripStore((s) => s.members)
  return ids.map((id) => members.find((m) => m.id === id)?.color ?? '#9CA3AF')
}

function bandFor(colors: string[]) {
  if (colors.length === 0) return '#9CA3AF'
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  const parts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`)
  return `linear-gradient(180deg, ${parts.join(', ')})`
}

export function TripNode({ data }: NodeProps) {
  const { trip, memberCount } = data as { trip: Trip; memberCount: number }
  return (
    <div className="rounded-xl border-2 border-gray-900 bg-white px-5 py-4 shadow-sm">
      <div className="text-lg font-semibold text-gray-900">{trip.destination}</div>
      <div className="mt-1 text-xs text-gray-500">
        {trip.days} days · {trip.currency} {trip.budgetPerPerson} pp · {memberCount} travellers
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}

export function CategoryNode({ data }: NodeProps) {
  const { label, count } = data as { label: string; count: number }
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="mt-0.5 text-xs text-gray-500">{count} items</div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}

export function StopNode({ data, selected }: NodeProps) {
  const { stop } = data as { stop: Stop }
  const colors = useMemberColors(stop.serves)
  return (
    <div
      className={`relative w-64 cursor-pointer rounded-lg py-1 pr-1 pl-5 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
      style={{ background: bandFor(colors) }}
    >
      <div className="rounded-md bg-white/95 px-3 py-2">
        <div className="text-sm font-semibold text-gray-900">{stop.name}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          Day {stop.day} · {stop.start} · {stop.durationMin} min
        </div>
      </div>
      {stop.conflicts.length > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 rounded-tr-md bg-[linear-gradient(to_bottom_left,transparent_46%,#4B5563_46%,#4B5563_54%,transparent_54%)]" />
      )}
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function BookingNode({ data, selected }: NodeProps) {
  const { booking } = data as { booking: Booking }
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
    >
      <div className="text-sm font-semibold text-gray-900">
        {booking.type === 'flight' ? '✈' : '⌂'} {booking.title}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        {booking.ref} · affects day {booking.affectsDay}
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function BudgetNode({ data, selected }: NodeProps) {
  const { expense } = data as { expense: Expense }
  const members = useTripStore((s) => s.members)
  const currency = useTripStore((s) => s.trip.currency)
  const payer = members.find((m) => m.id === expense.paidBy)
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
    >
      <div className="text-sm font-semibold text-gray-900">
        {currency} {expense.amount}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        paid by {payer?.name ?? 'unknown'} · split {expense.splitAmong.length} ways
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function MemberNode({ data, selected }: NodeProps) {
  const { member } = data as { member: Member }
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg py-1 pr-1 pl-5 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
      style={{ background: member.color }}
    >
      <div className="rounded-md bg-white/95 px-3 py-2">
        <div className="text-sm font-semibold text-gray-900">{member.name}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          {member.pace} · cap {member.budgetCap}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export const nodeTypes = {
  trip: TripNode,
  category: CategoryNode,
  stop: StopNode,
  booking: BookingNode,
  budget: BudgetNode,
  member: MemberNode,
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/nodes/nodeTypes.tsx
git commit -m "feat: add mindmap node components"
```

---

### Task 7: Shell, canvas and detail drawer

Wires everything together and deletes the superseded demo.

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/NodeDrawer.tsx`
- Create: `src/components/TripCanvas.tsx`
- Modify: `src/App.tsx`
- Delete: `src/TripMap.tsx`, `src/TripMap.css`, `src/data/trip.json`, `src/data/trip_delayed.json`

**Interfaces:**
- Consumes: `useTripStore`, `buildCategoriesGraph`, `nodeTypes`.
- Produces: a running app where clicking any node opens a Mantine `Drawer` with that node's details.

- [ ] **Step 1: Write the header**

Create `src/components/Header.tsx`:

```tsx
import { Button, Group, SegmentedControl, Text } from '@mantine/core'
import type { LensId } from '../domain/types'
import { useTripStore } from '../store/tripStore'

export function Header() {
  const trip = useTripStore((s) => s.trip)
  const members = useTripStore((s) => s.members)
  const lens = useTripStore((s) => s.lens)
  const setLens = useTripStore((s) => s.setLens)
  const reset = useTripStore((s) => s.reset)

  return (
    <Group justify="space-between" className="border-b border-gray-200 bg-white px-6 py-3">
      <div>
        <Text fw={600} size="md">{trip.destination}</Text>
        <Text size="xs" c="dimmed">
          {trip.days} days · {trip.currency} {trip.budgetPerPerson} per person · {members.length} travellers
        </Text>
      </div>
      <Group gap="sm">
        <SegmentedControl
          size="xs"
          value={lens}
          onChange={(value) => setLens(value as LensId)}
          data={[
            { label: 'Categories', value: 'categories' },
            { label: 'Itinerary', value: 'itinerary' },
            { label: 'People', value: 'people' },
          ]}
        />
        <Button size="xs" variant="default" onClick={reset}>Reset trip</Button>
      </Group>
    </Group>
  )
}
```

Note: the `itinerary` and `people` options are wired but their builders arrive in Phase 4. Task 7 Step 3 falls back to the category graph for them, so selecting those shows the same map rather than crashing.

- [ ] **Step 2: Write the detail drawer**

Create `src/components/NodeDrawer.tsx`:

```tsx
import { Badge, Drawer, Group, Stack, Text } from '@mantine/core'
import type { Booking, Expense, Member, Stop } from '../domain/types'
import { useTripStore } from '../store/tripStore'

function endTime(start: string, durationMin: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + durationMin
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function MemberBadges({ ids }: { ids: string[] }) {
  const members = useTripStore((s) => s.members)
  if (ids.length === 0) return <Text size="sm" c="dimmed">Nobody</Text>
  return (
    <Group gap="xs">
      {ids.map((id) => {
        const m = members.find((x) => x.id === id)
        if (!m) return null
        return (
          <Badge key={id} variant="outline" style={{ color: m.color, borderColor: m.color }}>
            {m.name}
          </Badge>
        )
      })}
    </Group>
  )
}

export function NodeDrawer() {
  const selectedNodeId = useTripStore((s) => s.selectedNodeId)
  const select = useTripStore((s) => s.select)
  const { stops, bookings, expenses, members, trip } = useTripStore((s) => s)

  const stop = stops.find((s) => s.id === selectedNodeId)
  const booking = bookings.find((b) => b.id === selectedNodeId)
  const expense = expenses.find((e) => e.id === selectedNodeId)
  const member = members.find((m) => m.id === selectedNodeId)
  const open = Boolean(stop || booking || expense || member)

  return (
    <Drawer opened={open} onClose={() => select(null)} position="right" size={380} padding="lg"
      title={stop?.name ?? booking?.title ?? member?.name ?? (expense ? 'Expense' : '')}>
      {stop && <StopBody stop={stop} currency={trip.currency} />}
      {booking && <BookingBody booking={booking} currency={trip.currency} />}
      {expense && <ExpenseBody expense={expense} currency={trip.currency} />}
      {member && <MemberBody member={member} />}
    </Drawer>
  )
}

function StopBody({ stop, currency }: { stop: Stop; currency: string }) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Day {stop.day} · {stop.start}–{endTime(stop.start, stop.durationMin)} · {stop.durationMin} min · {currency} {stop.costPerPerson} per person
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
    </Stack>
  )
}

function BookingBody({ booking, currency }: { booking: Booking; currency: string }) {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">Reference {booking.ref}</Text>
      <Text size="sm">Starts {new Date(booking.start).toLocaleString()}</Text>
      <Text size="sm">Ends {new Date(booking.end).toLocaleString()}</Text>
      <Text size="sm">{currency} {booking.cost} · affects day {booking.affectsDay}</Text>
    </Stack>
  )
}

function ExpenseBody({ expense, currency }: { expense: Expense; currency: string }) {
  return (
    <Stack gap="md">
      <Text size="sm">{currency} {expense.amount}</Text>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Paid by</Text>
        <MemberBadges ids={[expense.paidBy]} />
      </div>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Split among</Text>
        <MemberBadges ids={expense.splitAmong} />
      </div>
    </Stack>
  )
}

function MemberBody({ member }: { member: Member }) {
  return (
    <Stack gap="xs">
      <Text size="sm">Pace: {member.pace}</Text>
      <Text size="sm">Budget cap: {member.budgetCap}</Text>
      <Text size="sm">Must have: {member.must.join(', ') || 'nothing specified'}</Text>
      <Text size="sm">Avoids: {member.avoid.join(', ') || 'nothing'}</Text>
    </Stack>
  )
}
```

- [ ] **Step 3: Write the canvas**

Create `src/components/TripCanvas.tsx`:

```tsx
import { useEffect, useMemo } from 'react'
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes/nodeTypes'
import { buildCategoriesGraph } from '../graph/categories'
import { useTripStore } from '../store/tripStore'

function Canvas() {
  // Subscribe to the trip data slices only. Subscribing to the whole store would
  // rebuild the graph every time selectedNodeId changes, wiping React Flow's
  // internal selection the instant you click a node.
  const trip = useTripStore((s) => s.trip)
  const members = useTripStore((s) => s.members)
  const stops = useTripStore((s) => s.stops)
  const bookings = useTripStore((s) => s.bookings)
  const expenses = useTripStore((s) => s.expenses)
  const select = useTripStore((s) => s.select)
  const { fitView } = useReactFlow()

  // Phase 4 replaces this with a lens lookup; until then every lens renders categories.
  const graph = useMemo(
    () => buildCategoriesGraph({ trip, members, stops, bookings, expenses }),
    [trip, members, stops, bookings, expenses],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  useEffect(() => {
    const refit = () => {
      window.setTimeout(() => fitView({ padding: 0.15 }), 120)
    }
    window.addEventListener('resize', refit)
    return () => window.removeEventListener('resize', refit)
  }, [fitView])

  const onNodeClick: NodeMouseHandler = (_, node) => select(node.id)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={() => select(null)}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      nodesDraggable={false}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} color="#E5E7EB" />
    </ReactFlow>
  )
}

export function TripCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
```

- [ ] **Step 4: Rewrite App**

Replace `src/App.tsx` entirely:

```tsx
import { Header } from './components/Header'
import { NodeDrawer } from './components/NodeDrawer'
import { TripCanvas } from './components/TripCanvas'

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <Header />
      <div className="min-h-0 flex-1 bg-gray-50">
        <TripCanvas />
      </div>
      <NodeDrawer />
    </div>
  )
}
```

- [ ] **Step 5: Delete the superseded demo**

```bash
git rm src/TripMap.tsx src/TripMap.css src/data/trip.json src/data/trip_delayed.json
```

- [ ] **Step 6: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 7: Verify in the browser**

Run `npm run dev`, open the printed URL, and confirm:
1. The map renders 26 nodes: 1 trip, 4 categories, and 21 leaves (11 stops, 3 bookings, 3 expenses, 4 members).
2. Stop nodes show a stacked colour band matching their `serves`.
3. Stops with conflicts show the corner slash.
4. Clicking a stop opens the drawer with times, "Planned for", "At the cost of" and the reason.
5. Clicking a booking, expense and member each opens the correct drawer body.
6. Clicking empty canvas closes the drawer.
7. Resizing the window refits the map with nothing clipped.
8. Editing a stop name in devtools state, reloading, and seeing it persist; then "Reset trip" restores it.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: mindmap shell with category lens and node drawers"
```

---

## Phase 1 exit criteria

- `npm test` passes with 23 tests across four files.
- `npm run build` succeeds.
- The browser checklist in Task 7 Step 7 passes end to end.
- The old demo files are gone from the repo.

## Deferred to later phases

| Phase | Content |
|---|---|
| 2 | Editing: add/edit/delete/reorder stops, validation |
| 3 | Bookings and budget overlays, settlement suggestions |
| 4 | `itinerary.ts` and `people.ts` lens builders, wired to the switcher |
| 5 | Leaflet map overlay with pins and day routes |
| 6 | `ai/explain.ts`, settings modal, key handling, caching, fallbacks |
| 7 | `scoring.ts`, `planner.ts`, `disruption.ts` — real re-planning — plus demo polish |
