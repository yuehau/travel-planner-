# 07 · Demo Script

Three minutes. Rehearse until the clicks are muscle memory.

## Before you start

- [ ] `npm run build && npm run preview` — present the **built** app, not the dev server
- [ ] Browser at 100% zoom, window ~1280px wide
- [ ] Screen recording of a full successful run saved locally as a fallback
- [ ] `VITE_REPAIR_ENDPOINT` **unset** unless you have tested the live endpoint on the
      venue network. The offline engine produces the same three options and cannot fail.

## The run

### 0:00 — The hook *(before touching anything)*

> "Every travel app plans the trip you hoped for. None of them fix the trip you're
> actually having."

Pause. Then:

> "Four friends, three nights in Penang. Here's their plan."

### 0:20 — The group panel *(point at the right column)*

> "Before anything got booked, each of them told us four things: what they care about,
> what they can afford, how fast they like to move, and what they refuse to miss.
>
> Ali booked this whole trip around a cooking class. Sarah's ceiling is RM430 — and look,
> her share is exactly RM430. Zero headroom.
>
> The app doesn't hide that. It says it outright: **Sarah's ceiling is the binding
> constraint.** A group can argue with a stated compromise. It can't argue with an
> itinerary that just appeared."

### 0:50 — The dependencies *(point at the itinerary)*

> "And underneath, this isn't a list. Every line knows what it depends on. The transfer
> needs the flight. Check-in needs the transfer. The cooking class needs check-in.
>
> That's the whole trick — and it's the thing no other planner does."

### 1:10 — Break it *(click "Simulate: Flight AK6023 delayed")*

Let the screen land before you speak.

> "The flight slips five and a half hours.
>
> The app walks the graph. **Three bookings broken, one still viable** — the hotel desk is
> open until 22:00, so check-in survives. RM260 already spent is at risk.
>
> No other tool tells you the cooking class is gone. It only knows the flight moved."

### 1:40 — The options

> "Three ways out. Not three prices — three different *values*.
>
> **Preserve** protects every must-do. Costs RM130 more — and pushes Sarah over her ceiling.
>
> **Economise** saves RM160 and keeps everyone inside budget. But Ali loses the class he
> booked the trip for. Look at his line: minus 34%.
>
> **Save the evening** is the middle — the group still eats together, but Ali still loses
> the class."

Then the line that matters most — **slow down here:**

> "Notice what the app is telling you: **there is no option that keeps Ali's class AND
> stays inside Sarah's budget.** That's a real decision, and it belongs to them.
>
> Our job isn't to make it. It's to make it visible in ten seconds instead of an hour of
> group chat at an airport gate."

### 2:30 — Apply *(click "Apply this plan" on Preserve)*

> "One tap. Itinerary rewritten, budget updated, everyone notified.
>
> The transfer moved to 19:45. Check-in at 20:45, inside the window. Dinner at 21:30.
> And the cooking class found the gap on Day 2, between the heritage walk and Penang Hill.
> Those times are computed, not typed."

### 2:50 — Close

> "Every number you just saw was calculated from the trip's own data. The model chooses
> the strategy and writes the explanation — it is never asked for a figure, so it cannot
> invent one.
>
> That's Detour. Not another planner. The thing that fixes the plan when it breaks."

## Questions you will get

**"How is this different from TripIt / Wanderlog?"**
They tell you something changed. None of them work out what *else* broke, or weigh the fix
against what each traveller said mattered. *(Verify this yourself before saying it — see
`04-competitive-analysis.md`. Do not assert it on our word.)*

**"Isn't this just TREK with AI?"**
Fair question — we cloned TREK and read it. 527,000 lines; it does group trips, cost
splitting and AI booking import better than we would manage in a week. It has no disruption
recovery and no preference reconciliation. We built the part it left empty, and we copied
none of its code — it's AGPL-3.0.

**"What if the AI hallucinates a price?"**
It can't. It never sees or emits a number. It picks which bookings to move or drop; the
arithmetic is TypeScript over the trip's own rows.

**"Why not RAG or fine-tuning?"**
RAG needs a corpus — our trip data is small, structured, and fits in the prompt.
Fine-tuning needs a labelled dataset that doesn't exist, and would solve the wrong problem:
we reason over *this* trip, not world facts.

**"Does this work solo?"**
Yes. The preference step collapses to one profile; the cascade logic is unchanged.

**"What's not built?"**
Live booking APIs, so options are proposals rather than confirmed rebookings. Carrier push
notification. Offline support — which is ironic, because that's exactly when you need it.
All on the roadmap, none faked in this demo.

## If something breaks

- App won't load → play the recording and keep narrating
- Live endpoint hangs → it falls back to the offline engine automatically; say nothing
- Asked to try a different disruption → say it's seeded for this scenario, and offer to
  walk through the engine code. Do not improvise a live edit.
