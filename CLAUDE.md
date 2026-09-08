# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **demo prop** for a hackathon. Not a product.

The judges for this round **do not read the code and do not run this project**. Its only purpose is to produce a 40-second screen recording and a handful of screens for the pitch deck.

So there is exactly one test for every tradeoff: **will this appear in those 40 seconds?** If not, don't build it.

---

## Definition of done

Done means these four shots can be recorded back to back:

1. Open the screen → a 3-day itinerary laid out as a mind-map
2. Node colours make it obvious at a glance **who each stop was planned for**
3. Click a stop that has a conflict → a panel explains **whose preference got sacrificed, and why**
4. Press "Flight delayed 3 hours" → the day re-flows, and the app says what got dropped and who paid for it

Chase **looks real on camera**, not correctness, scalability, or error handling.

---

## Repo state

Nothing is scaffolded yet. Branches `main`, `junxi`, and `yap` all contain only `.gitignore`; `origin/HEAD` points at `junxi`. There is no `package.json`, so there are no build/lint/test commands until Stage 1 creates them.

Scaffold with:

```bash
npm create vite@latest . -- --template react-ts
npm install @xyflow/react
```

After that, `npm run dev` is the only command this project needs. Tests, lint config, and CI are on the prohibitions list.

---

## Hard prohibitions

None of the following may appear in this project, even if you think it would be quick:

- Any network request: Google Places, Maps, LLM APIs, any `fetch`
- Backends, API routes, servers
- Databases, Supabase, localStorage, any persistence
- Login, auth, user accounts
- Routing (react-router or similar) — single page is enough
- State management libraries (Redux / Zustand / Jotai) — `useState` is enough
- Tests, CI, Docker, environment variables
- Dark mode, i18n, or any abstraction layer beyond what the screens need

Ask me before adding any dependency.

---

## Stack

- Vite + React + TypeScript
- `@xyflow/react` (React Flow **v12**)
- Styling: plain `.css` files, no UI framework

> **React Flow was renamed in v12.** The package is `@xyflow/react`, not the old `reactflow`, and both the import paths and the CSS import differ from v11. Before writing any React Flow code, use `find-docs` to check the actual `@xyflow/react` v12 API. Do not write it from memory.

---

## Data contract

All data is hardcoded in `src/data/trip.json`. This schema is authoritative — do not rename fields.

```json
{
  "trip": {
    "destination": "Penang",
    "days": 3,
    "budget_per_person": 450,
    "currency": "MYR"
  },
  "members": [
    { "id": "m1", "name": "Yap", "color": "#3B82F6", "budget_cap": 500, "pace": "relaxed", "must": ["street food"], "avoid": ["hiking"] },
    { "id": "m2", "name": "Wei", "color": "#F59E0B", "budget_cap": 300, "pace": "packed",  "must": ["photo spots"], "avoid": [] },
    { "id": "m3", "name": "Mei", "color": "#10B981", "budget_cap": 600, "pace": "relaxed", "must": ["cafes"],       "avoid": ["seafood"] },
    { "id": "m4", "name": "Ali", "color": "#8B5CF6", "budget_cap": 400, "pace": "packed",  "must": [],              "avoid": ["pork"] }
  ],
  "stops": [
    {
      "id": "s1",
      "day": 1,
      "order": 1,
      "name": "Chulia Street night market",
      "start": "19:30",
      "duration_min": 90,
      "cost_per_person": 25,
      "serves": ["m1", "m2"],
      "conflicts": ["m4"],
      "reason": "Covers Yap's street food and Wei's photo spots. Ali avoids pork, so his options here are limited."
    }
  ]
}
```

### `serves` / `conflicts` / `reason` are the product

Every other field can be approximate. These three cannot:

- `serves` — **who** this stop was planned for (member ids, at least one)
- `conflicts` — **whose** preference this stop sacrifices (may be empty)
- `reason` — one plain sentence, shown directly in the UI, written to read well

`reason` is written for the user, not for an engineer. Write "Ali avoids pork, so his options here are limited" — not "member m4 preference violation: dietary".

### Content requirements

- Locations must be **real places in Penang** (Kek Lok Si, Penang Hill, the Armenian Street murals, Gurney Drive, Chew Jetty, Line Clear Nasi Kandar, Batu Ferringhi, and so on)
- 3–4 stops per day, 10–12 total
- **At least 4 stops must have a non-empty `conflicts`** — if nothing ever conflicts, the demo has no point
- Every member should appear in `serves` on some stops and in `conflicts` on others

---

## Visual direction

The team hasn't picked a colour theme yet, so use a **neutral base plus the member colours**. Don't invent a brand palette:

- Backgrounds, borders, text: greyscale
- The only source of colour is `members[].color`
- Stop node fill = the colour of the member(s) in `serves`; split the fill or use a two-colour gradient when there are several
- Nodes with a non-empty `conflicts` get a small corner marker — a neutral dot or a corner slash. A red exclamation mark reads as an error state.

Keep the layout clean, aligned, and consistently spaced. What gets scored on design is visual consistency and UX, not effects. No load animations, no hover bounce, no gradient backgrounds.

---

## Build stages

**Do one stage at a time, then stop and wait for my confirmation.** Don't implement later stages early, though you may keep them in mind when structuring things.

### Stage 1 — Static render

- `src/data/trip.json`, populated per the schema above
- `src/TripMap.tsx`: render the mind-map with `@xyflow/react`
  - Centre node = trip name → branches to Day 1 / 2 / 3 → each day branches to its stops
- Stop nodes coloured by `serves`
- Member legend in the top right (name + colour)
- No interaction

### Stage 2 — Stop detail

- Click a stop node → side panel or popover showing:
  - Name, time slot, duration, cost per person
  - "Planned for": the `serves` members, in their colours
  - "At the cost of": the `conflicts` members plus the `reason` sentence
- Add the corner marker to nodes with conflicts

### Stage 3 — Delay re-flow

- Create `src/data/trip_delayed.json`: Day 1 loses 3 hours to a delayed flight, the first two stops are dropped or pushed back, and the day re-flows
- A button at the top of the screen: "Flight delayed 3 hours"
- Pressing it **swaps to the other JSON file — pure state switch, no re-planning algorithm**
- After the switch, show a summary line: what was dropped, and whose preference paid for it
- Add a "Reset" button so the shot can be re-recorded easily

---

## Working rules

- Get it on screen first, then worry about structure. Don't build abstraction layers for future extension — this project has no future
- Don't refactor working code unprompted
- Don't write comments explaining the obvious
- Decide small things yourself: filenames, component splits
- Ask first if it involves a new dependency, a change to the schema above, or anything on the prohibitions list
- After each stage, tell me what you did in a sentence or two. No long reports.
