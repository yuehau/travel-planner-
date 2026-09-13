# Detour — prototype

React + TypeScript + Vite. See the [project README](../README.md) for what this is and why.

```bash
npm install
npm run dev                      # http://localhost:5173
npm run build && npm run preview # what you present
```

## Layout

| Path | What it is |
|---|---|
| `src/types.ts` | Domain model — trips, members, preferences, dependency edges |
| `src/data/seed.ts` | The seeded Penang trip and the disruption the demo injects |
| `src/engine/cascade.ts` | Topological walk that works out what a delay breaks |
| `src/engine/repair.ts` | Offline repair generator — slot finding, pricing, preference scoring |
| `src/engine/claude.ts` | Live path: asks the model for strategies, prices them locally |
| `src/components/` | Timeline, group panel, option cards, shared primitives |

## The one rule worth knowing

The model is never asked for a number. It chooses which bookings to move or drop and
writes the sentence explaining the tradeoff; every figure on screen — rebooking fees,
refunds, each person's share, who goes over their ceiling — is computed in
`src/engine/repair.ts` from the trip's own rows.

That means nothing shown to a user can be hallucinated, and the demo behaves identically
whether or not there is a network.

## Configuration

Nothing is required. With `VITE_REPAIR_ENDPOINT` unset, the offline engine runs.

To use the live model, deploy `../supabase/functions/repair` and set the endpoint. The
Anthropic key lives only in that function's secrets — never in this bundle. See
`.env.example`.
