# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **mindmap travel planner** for a hackathon (Lifestyle Track, "Planning an Escape"). The mindmap *is* the application, not a diagram of it: every part of a trip — a stop, a booking, a budget line, a traveller — is a node you open for its full detail. One screen, always; overlays for the heavy views.

It is pitched as a 40-second screen recording, so there is one test for every tradeoff: **will this appear in those 40 seconds?** If not, don't build it. Chase *looks real on camera* over completeness — but the logic underneath has to be genuinely correct, because the differentiator is that the app really computes who each decision serves and who paid for it.

The recording is these four shots, back to back:

1. Open the screen → the trip laid out as a mindmap
2. Node colours make it obvious at a glance **who each stop was planned for**
3. Click a stop that has a conflict → a panel explains **whose preference got sacrificed, and why**
4. Press "Flight delayed 3 hours" → the day re-plans, and the app says what got dropped and who paid for it

## Where the truth lives

- **Spec:** `docs/superpowers/specs/2026-09-08-mindmap-travel-planner-design.md` — problem, scope decisions, architecture, error handling, all seven phases. Read it before any non-trivial change.
- **Plans:** `docs/superpowers/plans/` — one task-by-task implementation plan per phase.

The spec supersedes the "Stage 1–3 demo prop" that earlier versions of this file described. Nothing about `src/data/trip.json`, `src/TripMap.tsx`, snake_case fields or a two-fixture delay swap is current.

## Module layout

```
src/
  domain/      pure logic, no React — this is where correctness lives
    types.ts     Trip, Member, Stop, Booking, Expense, TripState
    __tests__/   Vitest suites live here
  store/
    tripStore.ts Zustand + persist (localStorage key `travel-planner`)
    seed.ts      the Penang fixture
  graph/       each builder is a pure (TripState) → { nodes, edges }
    categories.ts, layout.ts, types.ts
  components/  Header.tsx, TripCanvas.tsx, NodeDrawer.tsx, nodes/nodeTypes.tsx
```

Each lens is a pure function from state to React Flow nodes and edges. Adding a lens is one new file in `src/graph/`.

## Commands

```bash
npm run dev     # Vite dev server
npm test        # Vitest, run once
npm run build   # tsc -b && vite build
npm run lint    # oxlint
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

## Visual direction

The team hasn't picked a colour theme, so use a **neutral base plus the member colours**. Don't invent a brand palette:

- Backgrounds, borders, text: greyscale
- The only source of colour is `members[].color`
- Stop node fill = the colour of the member(s) in `serves`; split the fill when there are several
- Nodes with a non-empty `conflicts` get a small corner marker — a neutral dot or a corner slash. A red exclamation mark reads as an error state.

Keep the layout clean, aligned, and consistently spaced. What gets scored on design is visual consistency and UX, not effects. No load animations, no hover bounce, no gradient backgrounds.

## Phase status

- **Phase 1 — Foundation: complete.** Domain types, seeded Penang fixture, persisted store, the categories lens, six node components, and the shell with read-only detail drawers.
- **Phases 2–7: specified, not built.** Editing; bookings and budget overlays with settlement; the itinerary and people lens builders; the Leaflet map overlay; AI explanations; real delay re-planning and demo polish. See the spec's Phasing section.

The lens switcher shows all three lenses because they communicate the product direction, but only Categories is selectable until Phase 4 ships the other two builders.

## Working rules

- Work one phase at a time from its plan, then stop and wait for confirmation. Don't implement later phases early.
- Domain and graph logic get real Vitest assertions. UI is verified in the browser, not with component tests.
- Don't refactor working code unprompted. Don't write comments explaining the obvious.
- Decide small things yourself: filenames, component splits.
- Ask first about a new dependency, a change to the domain types, or anything on the constraints list.
- After each phase, say what you did in a sentence or two. No long reports.
