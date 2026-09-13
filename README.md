# Detour

**Every travel app plans the trip you hoped for. None of them fix the trip you're actually having.**

Hackathon entry — Lifestyle Track, *Planning an Escape*.

> Working name. Not final.

---

## The idea in 30 seconds

A trip looks like a board — places, arranged in an order, connected by how you get between them.
Underneath, though, it's not a flat plan. It's a **dependency graph**: the transfer depends on the
flight, the check-in depends on the transfer, the prepaid cooking class depends on all of it.

Every existing planning tool shows you the board but stores a list. So when your flight slips five
hours, the tool can tell you that five things are now wrong — but not which ones, in what order, or
what to do about it. That falls to one exhausted person in a group chat, abroad, on bad wifi, at the
worst possible moment.

**Detour** looks and feels like a visual trip board — drag places onto a canvas, connect them into a
route, pick how you get between stops. But underneath that board sits the dependency graph. When
something breaks, Detour walks the graph, works out what else just broke, and proposes three ranked
repairs — each one weighed against the group's real budget and preferences, with the tradeoff stated
in plain language:

> *"Option 2 costs RM40 more but keeps the cooking class Ali flagged as a must-do.
> Option 3 is cheapest but drops it. Sarah's RM800 ceiling rules out Option 1 entirely."*

That sentence is the product. The board is how you get there.

---

## Documentation

| Doc | What's in it |
|---|---|
| [01 · Problem Analysis](docs/01-problem-analysis.md) | Problem tree, stakeholders, target user, success criteria |
| [02 · Ideation Mindmap](docs/02-ideation-mindmap.md) | Full ideation mindmap, five alternatives, weighted decision matrix |
| [03 · Iteration Log](docs/03-iteration-log.md) | How the idea evolved v0 → v3, and everything we dropped — including the merge decisions below |
| [04 · Competitive Analysis](docs/04-competitive-analysis.md) | TREK teardown and our differentiation |
| [05 · User Flows](docs/05-user-flows.md) | Onboarding, the board, the dependency graph, the disruption flow |
| [06 · Mentor Log](docs/06-mentor-log.md) | Mentor feedback and what it changed |
| [07 · Demo Script](docs/07-demo-script.md) | The three-minute run, and the questions to expect |

---

## What it does

- **A visual trip board.** Drag places from a searchable Malaysia catalog onto a canvas, connect them
  into a route, and pick how you travel between stops (walk, train, bus, car). Tap any place for a
  map, ratings and a short intel card. This is the surface the group actually plans on.
- **Group preference capture**, gathered up front: interests, budget ceiling, pace, and each person's
  non-negotiables. This isn't decoration — it's the input the repair engine reasons over later.
- **A consensus itinerary with a tradeoff panel**, naming plainly what couldn't be satisfied for
  everyone and why.
- **The trip stored as a dependency graph**, not a list — so the app actually knows that the transfer
  depends on the flight, not just that they happen to be next to each other on the board.
- **A disruption trigger.** One tap simulates a delay, cancellation, or budget shock. Detour walks the
  graph, finds the cascade, and returns three ranked recovery options with the tradeoff stated in
  plain language — not just "here's what changed."
- **One-tap apply**: the board rewrites itself, the budget updates, the group is notified.

---

## Running it

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

Present the built app, not the dev server:

```bash
npm run build && npm run preview
```

The demo needs no API key and no network. Leave `VITE_REPAIR_ENDPOINT` unset and the offline repair
engine runs — it produces the same three options and cannot be killed by venue wifi. To use the live
model, deploy the edge function in `supabase/functions/repair` and point `VITE_REPAIR_ENDPOINT` at it.
See `.env.example`.

---

## Scope

### In — the prototype

- Group preference capture (interests, budget ceiling, pace, non-negotiables)
- Visual trip board: drag-drop places, connected route, transport picker per leg
- A curated Malaysia place catalog with map, ratings and a short intel card per place
- Consensus itinerary with a **tradeoff panel** naming what could not be satisfied
- Trip stored as a dependency graph
- Disruption trigger → cascade analysis → three ranked recovery options
- One-tap apply: itinerary rewritten, budget updated, group notified
- One well-populated demo board, ready to run cold

### Out — deliberately, and we say so

Live booking and pricing APIs · receipt OCR · real-time multi-device collaboration ·
offline PWA · native mobile · full CRUD trip editing · RAG · fine-tuning · a News/content feed ·
a saved-destinations/collections feature · PDF export · a second, parallel backend · light/dark
theming beyond the base palette.

Several of these — a content feed, saved collections, PDF export — were built out in an earlier
version of this project. They're solid features on their own, but they don't move either the
Feasibility or Impact scoring for a six-day build, and running two backends (a local Express+SQLite
prototype alongside Supabase) was duplicated effort for one team. Cutting them was a scope decision,
not an oversight — see [03 · Iteration Log](docs/03-iteration-log.md) for the reasoning, including
what stays on the roadmap.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind, `@xyflow/react` (React Flow) for the board, Leaflet for place maps | Fast, the team already knows it, and React Flow gives us the board for free |
| Backend | Supabase (Postgres + Auth) | Managed; Google auth in minutes; one backend, not two |
| AI | Claude (`claude-opus-5`) via a Supabase Edge Function | API key never reaches the browser bundle |
| Output | Structured outputs (`output_config.format`) | Recovery plans return as schema-valid JSON the UI renders directly — no parsing on stage |

### On the AI

There is **no chat box** anywhere in this product, on purpose.

Every AI call fires from a button with a fixed prompt template and a strict output schema.
Off-topic input is not filtered — it is structurally impossible, because there is nowhere
to type it. That is a design answer to a problem most teams try to solve with a model.

We use neither RAG nor fine-tuning. The trip data is small and structured and fits in the
prompt; retrieval solves a problem we do not have, and fine-tuning needs a dataset that
does not exist. The AI's job is to weigh things that share no unit — money against time
against whose preference gets sacrificed — and to explain that weighing in language a
group can push back on.

---

## Licence and attribution

This project contains **no third-party application source**.

[TREK](https://github.com/liketrek/trek) (AGPL-3.0) was cloned and studied as competitive
research — see [04 · Competitive Analysis](docs/04-competitive-analysis.md). No code from
it, or from any other AGPL project, is used here.
