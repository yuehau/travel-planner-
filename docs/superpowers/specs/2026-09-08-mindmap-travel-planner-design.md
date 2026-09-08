# Mindmap Travel Planner — Design

**Date:** 2026-09-08
**Status:** Approved for planning
**Supersedes:** the Stage 1–3 demo prop described in `CLAUDE.md`

## Problem

From the hackathon brief (Lifestyle Track, "Planning an Escape"):

> Most travel apps only handle one piece of this — either bookings, or budgeting, or itineraries. So travellers end up manually piecing it all together themselves. Group trips make it worse, since getting everyone's schedules, budgets, and preferences to line up is genuinely difficult. And when something changes mid-trip, there's rarely any real help from existing platforms in adjusting.

The brief asks for budgeting, itinerary building, group preference syncing, and re-planning when things go wrong.

## The idea

A trip planner where **the mindmap is the application**, not a diagram of it. Every part of a trip — a stop, a flight, a hotel, a budget line, a traveller — is a node you can open, and its full detail lives in that node. One centralised map replaces the "five apps and a group chat".

The differentiator over a general planner (e.g. TREK) is that the map shows **who each decision was made for and who paid for it**, and can genuinely re-plan when a flight is delayed.

## Scope decisions

Settled during brainstorming on 2026-09-08:

| Decision | Choice |
|---|---|
| Rules | No backend, no database, no auth. Client routing, a real map library, and local persistence are allowed. (Routing is permitted but goes unused — the chosen single-screen structure has nothing to route between. No router dependency is added.) |
| Map shape | All three lenses (category / itinerary / people) over **one shared data model**. |
| How real | Editable planner. Add, edit, remove, reorder; changes survive reload via `localStorage`. Trips are pre-seeded — no onboarding flow. |
| Features | AI-generated itinerary, real interactive map, budget tracking + cost splitting, bookings (flights and stays). Group preference matching and delay re-planning carried over. |
| AI | Hybrid: a local algorithm decides the plan; Claude writes the explanations, with pre-generated text as fallback. |
| API key | Never committed. Pasted at runtime into settings, stored in `localStorage`. App is fully functional with no key. |
| Styling | Tailwind + Mantine. |
| Structure | Mindmap as the shell — one screen, overlays for heavy views. |
| Time budget | More than a week; phased delivery. |

### Non-goals

- No server, database, user accounts, or real booking/pricing APIs.
- No trip creation from scratch — trips are seeded fixtures.
- No real-time multi-user sync (TREK has it; we are not building it).
- No mobile/PWA work. Desktop browser only.

## Architecture

**Mindmap as the shell.** One screen. A Mantine header holds the trip title, lens switcher, disruption trigger and settings. Below it, a full-bleed React Flow canvas. Clicking any node opens a Mantine `Drawer` with that node's details and edit controls. Two views are too table-heavy for a drawer and open as full-screen `Modal` overlays launched from their category node: the **Penang map** (Leaflet) and the **budget/settlement table**.

The camera never leaves the mindmap, which is what makes the 40-second recording work.

### Module layout

```
src/
  domain/          pure logic, no React — this is where correctness lives
    types.ts       Trip, Member, Stop, Booking, Expense
    scoring.ts     score(stop, member) → number
    planner.ts     generate(members, candidates, budget) → Stop[]
    disruption.ts  applyDelay(state, hours) → { state, dropped, shifted, paidBy }
    budget.ts      totals, per-person spend, settlement suggestions
  store/
    tripStore.ts   Zustand + persist middleware (localStorage)
    seed.ts        the Penang fixture
  graph/           each a pure (TripState) → { nodes, edges }
    categories.ts  Trip → Itinerary/Bookings/Budget/People → items
    itinerary.ts   Trip → Days → stops + bookings inline
    people.ts      Members → Trip → Days → stops
  components/
    nodes/         TripNode, CategoryNode, DayNode, StopNode, BookingNode,
                   BudgetNode, MemberNode
    panels/        node detail drawers, one per node type
    overlays/      MapOverlay (Leaflet), BudgetOverlay (table)
    Shell.tsx, Header.tsx, LensSwitcher.tsx, SettingsModal.tsx
  ai/
    explain.ts     Claude call + cache + fallback
```

### Data model

| Entity | Key fields |
|---|---|
| `Trip` | id, destination, startDate, days, currency, budgetPerPerson |
| `Member` | id, name, colour, budgetCap, pace, must[], avoid[] |
| `Stop` | id, day, order, name, start, durationMin, costPerPerson, **lat, lng**, category, serves[], conflicts[], reason |
| `Booking` | id, type (flight \| stay), title, ref, start, end, cost, affectsDay |
| `Expense` | id, sourceId, paidBy, amount, splitAmong[] |

`lat`/`lng` on every stop is what makes the Leaflet map a free projection of existing data rather than a separate feature.

### Three lenses, one graph

Each lens is a pure function from state to React Flow nodes and edges. Switching lens swaps which builder runs; nothing else changes. A fourth lens later is one new file.

### State and persistence

Zustand with the `persist` middleware. This overrides `CLAUDE.md`'s ban on state libraries, which assumed a read-only app; with editing plus persistence, prop-drilling `useState` is untenable. `persist` satisfies the localStorage requirement in one line. A "Reset trip" action reseeds from the fixture so demos can be re-recorded.

## Features

### Preference matching

`scoring.ts` scores each stop against each member from `must`/`avoid` keywords, `budgetCap` and `pace`. Output drives `serves` (positive scorers) and `conflicts` (negative scorers). This is the honest engine behind both generation and re-planning.

### Itinerary generation

`planner.ts` selects and orders stops from a candidate pool to maximise total member satisfaction within the budget and the day's time. Deterministic and offline.

### Disruption re-planning

`applyDelay(state, 3)` recomputes the affected day: it drops the lowest-scoring stops until the remaining schedule fits the shortened window, shifts the survivors, and returns what was dropped and whose preferences absorbed it. **This replaces the two-fixture swap in the current build with genuine re-planning** — the result is computed, not authored.

Risk accepted: because the result is computed, the demo's quality depends on scoring being tuned. Budget time for that.

### Budget and splitting

`budget.ts` computes running spend against each person's cap, who paid what, and minimal settlement suggestions ("Yap owes Wei MYR 40"). Pure local computation.

### Map

Leaflet with OpenStreetMap tiles, pins per stop coloured by `serves`, routes per day. Opens as a full-screen overlay from the Itinerary node.

### AI explanations

`explain.ts` sends the computed decision (chosen stops, who they serve, who they conflict with) to Claude and gets back the human-readable "why" sentences. Results are cached in the store keyed by a hash of the decision. The seeded fixture ships with pre-written explanations, so the app is complete with no key and no network.

**Key handling:** entered at runtime in Settings, stored in `localStorage`, never committed. With no key the app silently uses fallback text.

## Error handling

| Failure | Behaviour |
|---|---|
| No API key | Use fallback explanations. A quiet note in Settings, no error UI. |
| Claude call fails or times out | Fall back to cached or seeded text. Non-blocking toast. |
| Invalid API key | Mantine notification; fall back. Key is not cleared. |
| Corrupt/absent localStorage | Reseed from fixture rather than crashing. |
| Map tiles unreachable | Leaflet renders a blank canvas with pins still correctly positioned. Acceptable; note it before demoing offline. |
| Re-plan drops everything | Guard: always retain at least one stop per day. |

## Testing

- **Vitest on `src/domain/`** — scoring, planner, disruption, budget. Pure functions, real assertions, this is where correctness lives.
- **UI verified in the browser** via the Chrome extension, as in the current build. No component unit tests.
- Every phase ends with a browser pass confirming the demo path still records.

## Phasing

Each phase ends with something recordable.

1. **Foundation** — types, seed fixture, store + persist, shell, header, categories lens, read-only node drawers. Replaces the current app.
2. **Editing** — add/edit/delete/reorder stops; validation; reset action.
3. **Bookings and budget** — booking nodes, expense model, budget overlay with settlement.
4. **Lenses** — itinerary and people builders, lens switcher.
5. **Map** — Leaflet overlay with pins and day routes.
6. **AI** — `explain.ts`, settings modal, caching, fallbacks.
7. **Disruption and polish** — real re-planning, summary of who paid, visual pass, demo rehearsal.

## What carries over from the current build

- The Penang content in `src/data/trip.json` — real places, times, costs, and the hand-written `reason` sentences — becomes the seed fixture. It needs `lat`/`lng` added.
- The `serves`/`conflicts`/`reason` concept, which is the product's differentiator.
- Everything else in `src/TripMap.tsx` is superseded.
