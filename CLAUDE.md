# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **mindmap travel planner** for a hackathon (Lifestyle Track, "Planning an Escape"). The mindmap *is* the application, not a diagram of it: every part of a trip — a stop, a booking, a budget line, a traveller — is a node you open for its full detail. One screen, always; overlays for the heavy views.

### How this is actually judged

Read `all file/Prototype Judging Rubrics (1).pdf` and `all file/Submission Template.pdf` before optimising anything. The short version, because it is counter-intuitive:

- **Working code earns no marks directly at the prototype stage.** The template says outright that the prototype is the UI design and the demo is walking through screens. Building is a separate three-week phase afterwards.
- Roughly **40% of the grade lives in `README.md`** — Ideation 25% (mindmaps, iteration history, mentor feedback, breadth of alternatives) and Feasibility 15% (stack rationale, build plan, time awareness).
- Impact is 20%, Creativity 15%, Presentation 15% (the video), Design 10% (the UI itself).
- The video is **3–5 minutes, aim 4:30, marks lost over 5:00** — not a wordless 40-second reel. It covers solution and novelty, the demo, stack and build plan, then impact.
- **Stipulation 6: the app must be deployable**, not local-only.

So the tradeoff test is: *does this strengthen the README, the video, or the UI a judge will look at?* Shipping another phase of backend-free features usually loses to writing up the one already built.

The demo path through the app is:

1. Open the screen → the trip laid out as a mindmap
2. Node colours make it obvious at a glance **who each stop was planned for**
3. Click a stop that has a conflict → a panel explains **whose preference got sacrificed, and why**
4. Press "Flight delayed 3 hours" → the day re-plans, and the app says what got dropped and who paid for it — **Phase 7, not built yet**

## Where the truth lives

- **Spec:** `docs/superpowers/specs/2026-09-08-mindmap-travel-planner-design.md` — problem, scope decisions, architecture, error handling, all seven phases. Read it before any non-trivial change.
- **Plans:** `docs/superpowers/plans/` — one task-by-task implementation plan per phase.

The spec supersedes the "Stage 1–3 demo prop" that earlier versions of this file described. Nothing about `src/data/trip.json`, `src/TripMap.tsx`, snake_case fields or a two-fixture delay swap is current.

## Module layout

```
src/
  domain/      pure logic, no React, no store import — this is where correctness lives
    types.ts     Trip, Member, Stop, Booking, Expense, TripState
    stops.ts     StopDraft, validateStop, nextStopId, insert/remove/move/editStop
    __tests__/   Vitest suites live here, including the store's
  store/
    tripStore.ts Zustand + persist (localStorage key `travel-planner`)
    seed.ts      the Penang fixture
  graph/       each builder is a pure (TripState) → { nodes, edges }
    categories.ts, layout.ts, types.ts
  components/  Header.tsx, TripCanvas.tsx, NodeDrawer.tsx, StopForm.tsx, nodes/nodeTypes.tsx
```

Each lens is a pure function from state to React Flow nodes and edges. Adding a lens is one new file in `src/graph/`. Mutation logic belongs in `src/domain/`, never in the store — store actions are one-line delegations, which is what keeps the logic testable in Node.

## Commands

```bash
npm run dev          # Vite dev server
npm test             # Vitest, run once (85 tests, 6 files)
npm run test:watch   # Vitest in watch mode
npm run build        # tsc -b && vite build
npm run lint         # oxlint

npx vitest run src/domain/__tests__/stops.test.ts   # one file
npx vitest run -t "closes the gap in the old day"   # one test by name
```

## Stack

- Vite 8 + React 19 + TypeScript
- `@xyflow/react` (React Flow **v12**) — the package was renamed from `reactflow` in v12, and both the import paths and the CSS import differ from v11. Use `find-docs` to check the real v12 API before writing React Flow code; do not write it from memory.
- Mantine 9 + Tailwind v4. Mantine must be imported as `@mantine/core/styles.layer.css` (the `@layer mantine` build) so Tailwind utilities win without specificity hacks. Never import both `styles.css` and `styles.layer.css`.
- Zustand with the `persist` middleware; Vitest + jsdom.

## Constraints

Still true, and not negotiable without changing the spec:

- No backend, no database, no auth, no real booking or pricing APIs.
- No router — the shell is a single screen with nothing to route between.
- No API key ever committed. Keys are pasted at runtime and stored in localStorage; the app is fully functional without one.
- Persistence is localStorage only, via Zustand `persist`.
- Desktop browser only. No mobile, no PWA.
- Field naming is `color`, never `colour`.
- Ask before adding a dependency.

## The data model

`src/domain/types.ts` is authoritative and camelCase (`budgetPerPerson`, `durationMin`, `costPerPerson`). The fixture is `src/store/seed.ts`. Don't rename fields without updating both.

Three fields on `Stop` are the product; every other field can be approximate:

- `serves` — **who** this stop was planned for (member ids, at least one)
- `conflicts` — **whose** preference it sacrifices (may be empty)
- `reason` — one plain sentence, shown directly in the UI, written for the user rather than an engineer: "Ali avoids pork, so his options here are limited", not "member m4 preference violation: dietary".

Stops are real places in Penang, and at least four must have a non-empty `conflicts` — if nothing ever conflicts, the demo has no point.

## Invariants the test suite enforces

Break one of these and tests fail, usually far from the change:

- **`order` runs 1..n contiguously within each day**, after any sequence of add, delete, move or cross-day edit. Every mutator funnels through `renumberDay`/`assignOrders` in `src/domain/stops.ts` for exactly this reason.
- **`order` is a sort key, never a position.** The store's `stops` array order means nothing; `buildCategoriesGraph` sorts by `(day, order)` to lay nodes out. A mutator that updates `order` without the builder sorting produces a feature that silently does nothing on screen — that shipped once and only the browser gate caught it.
- **Every stop serves at least one member.** `validateStop` rejects an empty `serves`.
- **Stop ids are `s<n>`, from the highest existing suffix**, never reused after a delete. They share a namespace with `b*`/`e*`/`m*`/`cat-*`/`trip` because React Flow forbids duplicate node ids.

## Store traps

- **`partialize` is an allowlist.** Any new persisted field must be added to it by hand or it silently stops persisting — and you won't notice until a reload.
- **`merge` pins transient fields** (`selectedNodeId`, `lens`) to fixed values on rehydration. `partialize` only governs what gets *written*; entries already in a user's localStorage still carry old fields, and Zustand's merge lets the persisted value win. Both pins come out in Phase 4.
- **Use `editStop`, not `updateStop`.** Only `editStop` is day-aware and renumbers both days when a stop changes day. `updateStop`'s type excludes `day` and `order` so this is enforced by the compiler rather than by comment.

## Visual direction

The team hasn't picked a colour theme, so use a **neutral base plus the member colours**. Don't invent a brand palette:

- Backgrounds, borders, text: greyscale
- The only source of colour is `members[].color`
- Stop node fill = the colour of the member(s) in `serves`; split the fill when there are several
- Nodes with a non-empty `conflicts` get a small corner marker — a neutral dot or a corner slash. A red exclamation mark reads as an error state.

Keep the layout clean, aligned, and consistently spaced. What gets scored on design is visual consistency and UX, not effects. No load animations, no hover bounce, no gradient backgrounds.

## Phase status

- **Phase 1 — Foundation: complete.** Domain types, seeded Penang fixture, persisted store, the categories lens, six node components, and the shell with detail drawers.
- **Phase 2 — Editing: complete.** Add, edit, delete and reorder stops, with validation, persisting across reload.
- **Phases 3–7: specified, not built.** Bookings and budget overlays with settlement; the itinerary and people lens builders; the Leaflet map overlay; AI explanations; real delay re-planning and demo polish. See the spec's Phasing section.

Shot 4 of the recording needs Phase 7 — the delay re-plan does not exist yet.

The lens switcher shows all three lenses because they communicate the product direction, but Itinerary and People are `disabled` until Phase 4 ships their builders. Re-enabling them means, together: removing the `disabled` flags in `Header.tsx`, dropping the `lens` pin from the store's `merge`, and restoring `lens` to `partialize`. Do all three or none.

New stops get placeholder coordinates (`DEFAULT_COORDS`, George Town). Map-picking is Phase 5.

## Working rules

- Work one phase at a time from its plan, then stop and wait for confirmation. Don't implement later phases early.
- Domain and graph logic get real Vitest assertions. UI is verified in the browser, not with component tests.
- **A green suite proves nothing about what renders.** This project has shipped two defects that every test passed through: a completely blank canvas (Tailwind utilities never compiled), and a reorder feature that changed no pixels (`order` written but never read). Both were found only by opening the page. End every phase by actually looking at it.
- When driving the browser via automation, note that the tab often reports `document.visibilityState === "hidden"`, which starves `requestAnimationFrame`. Mantine transitions and React Flow measurement then behave abnormally, and JS-dispatched clicks may not open a Drawer at all. Real input injection works; a symptom that only appears under automation is probably this, not a bug.
- Don't refactor working code unprompted. Don't write comments explaining the obvious.
- Decide small things yourself: filenames, component splits.
- Ask first about a new dependency, a change to the domain types, or anything on the constraints list.
- After each phase, say what you did in a sentence or two. No long reports.
