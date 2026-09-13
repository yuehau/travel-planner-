# TravelPlanner

A visual trip planner for Malaysia. Every trip is a **board**: drag places from a searchable catalog onto an n8n-style canvas, connect them into a route, and pick how you travel between stops (walk, train, bus or car). Tap any place for a map, ratings and reviews. A **News** page shares short stories about new cafés, beaches and markets that you can like.

## Objective
Replace spreadsheet-style trip planning with a calm, visual flow. The board shows the whole plan at a glance; the catalog keeps place data one drag away; the palette (`#28536B` · `#C2948A` · `#7EA8BE` · `#F6F0ED` · `#BBB193`) keeps it vibrant and chill.

## Flow
Landing → Sign in / Explore demo → Dashboard → New Trip → **Trip Board**

## Key Features
- **Trip Board** (`/trip/:id`): React Flow canvas with place cards, route edges, a transport picker with rough leg estimates, keyboard delete, minimap and zoom controls. Positions and routes persist.
- **Places sidebar**: search by name, city or vibe; filter by region and category; drag onto the board or add with one tap.
- **Place intel modal**: illustration, description, opening hours, price level, sample reviews, an embedded Leaflet map and an "Open in Google Maps" link.
- **Malaysia catalog**: 42 places across Kuala Lumpur, Penang, Langkawi, Malacca, Cameron Highlands, Ipoh and Sabah, each with a generated SVG illustration.
- **Three seeded boards** with different vibes: *KL City Lights*, *Penang Heritage & Street Food*, *Langkawi Island Escape*.
- **Dashboard**: "Popular right now in Malaysia" banner, trip stats and region-illustrated trip cards.
- **News** (`/news`, `/news/:slug`): editorial posts with per-user likes.
- **Collections**: saved destinations (visited / want to go) that can seed a new board.
- **PDF export** of a board's route (local mode).
- Light and dark mode on the same palette; the dark board has the n8n dot-grid look.
- **Demo mode**: the same three boards, editable, saved in the browser without an account.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, `@xyflow/react` (React Flow) for the board, Leaflet for place maps.
- **Backend (local prototype)**: Express 5 + better-sqlite3, Argon2 password hashing, httpOnly cookie sessions, zod validation, PDFKit export.
- **Remote (parked)**: Supabase schema kept in `supabase-schema.sql`; the remote client supports trips/collections only.

## Getting Started
1. `npm install`
2. Copy `.env.example` to `.env` (keep `VITE_DATA_MODE=local`).
3. `npm run dev` — starts the local API on `http://127.0.0.1:5175` and Vite on `http://localhost:5173`.
4. Sign in with `demo@travelplanner.local` / `TravelPlanner123!`, create an account, or click **Explore the demo**.

Local data lives in `.local/travel-planner.sqlite` (gitignored). The server stores a schema version in the SQLite file; when the schema changes it drops and recreates the prototype database and reseeds the demo account.

## Content and illustrations
- `shared/malaysia-catalog.json` — the place catalog (name, region, category, vibes, coordinates, rating, sample reviews).
- `shared/seed-trips.json` — the three seeded boards (place positions and routes), used by both the local API and demo mode.
- `shared/news-posts.json` — News stories.
- `npm run art` regenerates `public/places/*.svg`, `public/regions/*.svg` and `public/news/*.svg` from those files. Output is committed.

## Development Commands
- `npm run dev` / `npm run dev:server` / `npm run dev:client`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run art`

## License
MIT
