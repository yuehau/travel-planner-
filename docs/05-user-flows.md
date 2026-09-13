# 05 · User Flows

Three flows. Only the third is the product — the first two exist to set it up.

## 1. Onboarding and preference capture

```mermaid
flowchart TD
    A["Landing page"] --> B["Sign in with Google"]
    B --> C{"Joining a trip<br/>or starting one?"}
    C -->|Start| D["Create trip<br/>dates · destination · total budget"]
    C -->|Join| E["Open invite link or scan QR"]
    D --> F["Invite the group"]
    E --> G
    F --> G["<b>Preference capture</b><br/>each member, 60 seconds"]
    G --> G1["Rank interests<br/>food · culture · nature · nightlife · rest"]
    G --> G2["Set personal budget ceiling"]
    G --> G3["Set pace<br/>packed · balanced · slow"]
    G --> G4["Flag non-negotiables<br/>must-dos · allergies · mobility"]
    G1 & G2 & G3 & G4 --> H["Consensus itinerary generated"]
    H --> I["<b>Tradeoff panel</b><br/>what we optimised for,<br/>and what we could not fit"]

    style G fill:#1f2937,stroke:#111827,color:#fff
    style I fill:#1f2937,stroke:#111827,color:#fff
```

The **tradeoff panel** is the part no competitor has. The app does not just merge
preferences — it reports what it could not satisfy and whose constraint was binding.
That turns an invisible algorithmic decision into something a group can argue with, which
is the only way a group actually accepts it.

## 2. The trip, as a dependency graph

This is the data model that makes everything else possible, drawn as the user sees it.

```mermaid
flowchart LR
    F["✈️ Flight<br/>arrives 14:00"] --> T["🚕 Airport transfer<br/>14:30"]
    T --> H["🏨 Hotel check-in<br/>15:00–22:00 window"]
    H --> C["🍜 Cooking class<br/>16:00 · prepaid · Ali's must-do"]
    C --> D["🍽️ Dinner reservation<br/>19:30 · party of 4"]
    H --> D

    style F fill:#fee2e2,stroke:#ef4444,stroke-width:2px
```

Every edge is a real dependency. Because the app knows them, a change at the flight node
has *computable* consequences — it does not need to guess what else is affected, and
neither does the user.

## 3. The disruption flow — the demo

```mermaid
flowchart TD
    START(["Flight delayed<br/>14:00 → 19:30"]) --> DETECT["App detects the change"]
    DETECT --> CASCADE["<b>Cascade analysis</b><br/>walk the dependency graph"]

    CASCADE --> BROKEN["3 items broken<br/>✗ transfer · ✗ cooking class · ✗ dinner"]
    CASCADE --> SAFE["1 item safe<br/>✓ hotel check-in window still open"]

    BROKEN --> AI["<b>Repair engine</b><br/>constraints: remaining budget,<br/>group preferences, what is prepaid"]
    SAFE --> AI

    AI --> O1["<b>Option 1 — Preserve</b><br/>move cooking class to Day 2<br/>+RM40 · keeps Ali's must-do"]
    AI --> O2["<b>Option 2 — Cheapest</b><br/>drop the class, late dinner<br/>−RM85 · Ali loses must-do"]
    AI --> O3["<b>Option 3 — Rest</b><br/>write off the evening<br/>−RM120 · matches Sarah's cap"]

    O1 & O2 & O3 --> CHOOSE["Group sees all three<br/>with cost and preference deltas"]
    CHOOSE --> APPLY["One tap applies it"]
    APPLY --> SYNC["Itinerary rewritten<br/>budget updated<br/>everyone notified"]

    style START fill:#fee2e2,stroke:#ef4444,stroke-width:2px
    style AI fill:#1f2937,stroke:#111827,color:#fff
    style SYNC fill:#dcfce7,stroke:#22c55e,stroke-width:2px
```

### Why this is the whole pitch

The three options are deliberately not ranked by a single number. They represent three
*different values* — preserve what matters most, spend least, protect everyone's energy.
A calculator cannot produce that set. It requires weighing things that do not share a unit,
and explaining the weighing in words the group can push back on.

That is what the AI is for. It is also why there is no chat box anywhere in this flow.

## 4. Screen inventory for the prototype

| # | Screen | Build | Priority |
|---|---|---|---|
| 1 | Landing | Static, minimal | P2 |
| 2 | Preference capture | Real, 4 inputs | **P0** |
| 3 | Trip view with dependency graph | Real, seeded data | **P0** |
| 4 | Cascade view — what just broke | Real | **P0** |
| 5 | Recovery options — 3 ranked cards | Real, live Claude call | **P0** |
| 6 | Applied state — updated itinerary and budget | Real | **P0** |
| 7 | Mind-map planner | **Mockup only** | P3 |

P0 screens are the demo. If time runs short, everything else is a mockup.
