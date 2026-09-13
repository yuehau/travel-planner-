# 04 · Competitive Analysis and Differentiation

## 1. Why this document exists

Naming your strongest competitor and explaining precisely what it cannot do is a stronger
position than pretending it does not exist. The rubric scores "Differentiation from
Existing Solutions" on whether we can explain *why we are different and better* — and a
judge who finds TREK after our pitch is a much worse outcome than a judge we hand it to.

## 2. TREK — the benchmark

**Verified directly.** The repository was cloned and inspected on 11 Sep 2026; the figures
below come from the source tree, not from marketing copy.

| | |
|---|---|
| Repository | `github.com/liketrek/trek` |
| Version inspected | 4.2.1 |
| Licence | **AGPL-3.0** |
| Source size | 3,053 TypeScript/TSX files · 527,052 lines |
| Localisation | 23 languages |
| Stack | React 19, Node/NestJS, Docker, plugin SDK |

### What it already does

| Area | Capability |
|---|---|
| Planning | Drag-and-drop day plans, three map engines, POI explore, route auto-sort (nearest-neighbour + 2-opt), GPX/KML import, ICS export |
| Bookings | 16 reservation types, multi-leg flights across 4,045 bundled airports, booking import from EML/PDF/PKPass |
| Money | Cost splitting in integer cents, multiple payers, custom shares, settle-up suggestions, settlement log, per-expense currency with frozen FX, CSV export, **receipts on expenses** |
| Groups | Real-time WebSocket sync, members and guests, 16-action permission matrix, reusable invite links, public read-only share |
| AI | MCP server with 199 tools / 30 resources / 4 prompts; LLM booking extraction via Ollama, OpenAI-compatible or Anthropic |
| Platform | Installable PWA, offline reads and queued offline writes, offline map tiles, OIDC SSO, passkeys, TOTP 2FA |

### What it does *not* do

Searched across the full source tree:

| Searched for | Result |
|---|---|
| Disruption handling / re-planning (`disrupt`, `re-plan`, `reschedul`, `flight.delay`) | **1 match**, and it is unrelated — flight-log import scheduling |
| Group preference reconciliation (`preference.sync`, `consensus`, `groupPreference`) | **0 matches** |

TREK has generic polls inside its group chat. It has no mechanism that captures what each
traveller values and optimises a plan against it, and nothing that responds to a plan
breaking mid-trip.

*Honest caveat: a grep is not a proof. We read the README in full and searched the source;
we did not read all 527,052 lines. If a judge knows otherwise, the right answer is "thank
you, that changes our comparison" — not a defence.*

### What we take from it

Nothing, in code. **This project copies no TREK source.**

Two reasons, and we state both if asked:

1. **Licence.** AGPL-3.0 is strong copyleft, and it is written so that network use counts,
   not just redistribution. Copying TREK's code would oblige us to release this project
   under AGPL-3.0 with source disclosed. The repository also carries a `TRADEMARKS.md`
   covering the name and logo. *We are not lawyers; this is why we did not go near it.*
2. **It would make us worse.** Our value is in the part TREK left empty. Cloning the part
   it already filled is the one move guaranteed to make us indistinguishable from it.

We read it as competitive research. That is what this document is.

## 3. Other tools — TO BE VERIFIED BEFORE THE PITCH

> 🚧 **Team: do not put these on a slide until someone has opened each product and
> checked.** A wrong claim about a competitor's features is worse in front of judges than
> no claim at all. Fill in the observed behaviour and the date you checked it.

| Product | Category | What to check | Verified? |
|---|---|---|---|
| Wanderlog | Itinerary + collaboration | Does it do anything when a flight is delayed? Any group preference input? | ☐ |
| TripIt | Itinerary aggregation from email | It is known for flight alerts — but does it *re-plan*, or only notify? This is the sharpest question for our thesis. | ☐ |
| Google Travel / Maps timeline | Aggregation + discovery | Any re-planning? Any group features? | ☐ |
| Splitwise | Expense splitting | Confirms cost-splitting is a solved commodity | ☐ |
| Airline apps | Disruption handling | They rebook **their own leg**. Do they touch anything downstream — your hotel, your tour? | ☐ |

**The likely shape of the answer** (to confirm, not assume): notification is common,
*repair* is not. Airlines rebook their own flight; nobody fixes the cascade of everything
that flight was holding up. If that holds after checking, it is the single strongest line
in the pitch.

## 4. Our differentiation, in one table

| | Existing planners | Airline apps | **Detour** |
|---|---|---|---|
| Builds the plan | ✅ | ❌ | ✅ (light) |
| Tells you something broke | Some | ✅ | ✅ |
| Knows what *else* broke as a result | ❌ | ❌ | ✅ |
| Proposes ranked repairs | ❌ | Own leg only | ✅ |
| Weighs repairs against group preferences | ❌ | ❌ | ✅ |
| Shows the cost delta before you commit | ❌ | ❌ | ✅ |
| Names whose preference got sacrificed | ❌ | ❌ | ✅ |

## 5. The one-sentence version

> Every travel app plans the trip you hoped for. None of them fix the trip you're actually having.
