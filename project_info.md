# Project Information: Travel Planner

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite 8, Tailwind CSS 4 (class-based dark mode), React Router 7
- **Board**: `@xyflow/react` 12 (React Flow), lazy-loaded with the trip route
- **Maps**: Leaflet / react-leaflet inside the place modal, lazy-loaded
- **Backend/Database/Auth**: Local Express 5 API + SQLite (`better-sqlite3`) for the working prototype; Supabase schema retained for a future remote mode
- **Authentication**: Local email/password sessions (Argon2 + httpOnly cookie); Google OAuth via Supabase is paused
- **State**: React Context for Auth, Theme and page transitions; board state in `useTripBoard`

## Development Commands
- `npm run dev` (API + client), `npm run dev:server`, `npm run dev:client`
- `npm run build`, `npm run lint`, `npm test`
- `npm run art` — regenerate SVG illustrations from the shared JSON

## Product Flow
Landing → Sign in / Demo → Dashboard → New Trip → Trip Board

## Core Functionality
1. **Dashboard** (`/dashboard`): popular-places banner (catalog `popular` entries → place modal or "Plan a trip in <region>"), Upcoming/Active/Past counts, trip cards with region cover art, New Trip FAB.
2. **New Trip**: name, Malaysian region (optional), dates, description → navigates to an empty board.
3. **Trip Board** (`/trip/:tripId`):
   - Left sidebar: catalog search (name/city/region/category/vibes), region chips (defaults to the trip's region), category select, draggable cards with a "+" fallback.
   - Canvas: drop creates a place; drag saves position; connecting handles creates a route (walk by default); clicking the edge pill changes the vehicle or removes the route; Delete/Backspace removes selected nodes/edges; minimap + controls; empty-state hint.
   - Node image → place modal: illustration, description, rating/reviews (sample data), opening hours, price level, Leaflet map, Google Maps link, the user's note.
   - Top bar: edit/delete trip, PDF export (local mode only), theme toggle.
4. **News** (`/news`, `/news/:slug`): seeded editorial posts with category filter and per-user like toggle.
5. **Collections** (`/collections`): saved destinations; "Plan trip" pre-fills the region when it matches a catalog region.
6. **Demo mode**: identical seeds, edits persisted in `localStorage` (`travel_planner_demo_store_v2`).

## Application Architecture
- `src/pages/` — `LandingPage`, `AuthPage`, `Dashboard`, `TripBoardPage`, `NewsPage`, `NewsPostPage`, `CollectionsPage`, `DemoRedirect`.
- `src/components/Board/` — `TripBoard` (React Flow wiring, drag/drop, delete), `BoardSidebar`, `PlaceNode`, `RouteEdge` (transport picker + leg estimate), `PlaceFocusModal`, `PlaceMap`, `boardContext`.
- `src/components/Dashboard/` — `PopularPlacesBanner`, `TripCard`, `CreateTripModal`, `TripCollections`.
- `src/components/News/` — `NewsCard`, `LikeButton`.
- `src/hooks/useTripBoard.ts` — loads places + links, maps them to nodes/edges, persists every change with optimistic updates.
- `src/data/catalog.ts`, `src/data/news.ts`, `src/data/demoSeed.ts` — zod-validated accessors over `shared/*.json`.
- `src/utils/` — `transport.ts` (modes/icons/speeds), `routeEstimate.ts` (haversine + duration), `boardGraph.ts` (nodes/edges mapping, route ordering), `tripStatus.ts`.
- `src/services/travelData.ts` — `TravelDataClient` contract, input types, validation helpers, `TravelDataError`.
- `src/services/localTravelData.ts` (fetch → local API), `demoTravelData.ts` (localStorage), `supabaseTravelData.ts` (trips/collections only; board and news throw "not available in remote mode").
- `server/index.mjs` — auth, trips, places, links, collections, news, PDF export.
- `server/db.mjs` — SQLite schema v2 (drops and recreates older prototype databases), ownership helpers.
- `server/seed.mjs` — reads `shared/*.json`, seeds the demo account's three boards and syncs news posts.
- `server/pdf.mjs` — route PDF (places in link order with leg estimates).
- `scripts/generate-place-art.mjs` — palette-styled SVG cards for places, regions and news covers.

## Theme
Tailwind `@theme` scales in `src/index.css`: `ocean` (#28536B), `clay` (#C2948A), `tide` (#7EA8BE), `sand` (#F6F0ED), `sage` (#BBB193). Semantic tokens (`surface`, `surface-raised`, `surface-sunken`, `ink`, `ink-muted`, `ink-faint`, `line`, `primary`, `accent`, `positive`, `danger`, `board-dot`) switch with the `.dark` class; components use `bg-surface`, `text-ink`, `bg-primary text-on-primary`, etc. React Flow chrome is themed through its `--xy-*` variables on `.react-flow`.

## Database (SQLite, schema v2)
- `users`, `sessions`
- `trips` (+ `region`, `cover_image`; `destination` is the trip title)
- `places` — board nodes: catalog snapshot (`catalog_id`, name, address, lat/lng, `photo_url`, rating, notes) + `position_x`/`position_y`
- `place_links` — directed routes with `transport_mode` (walk/car/bus/train); unique per (source, target); cascade on place delete
- `trip_collections`
- `news_posts` (upserted from `shared/news-posts.json` on startup), `news_likes` (pk post_id + user_id)
- Removed in v2: `itinerary_items`, `budget_items`, `packing_items`, `trip_infos`, `trip_todos`, `trip_members`, `user_settings`

`supabase-schema.sql` mirrors this for remote mode (RLS on every table; `news_posts` readable by any signed-in user).

## Local Prototype Configuration
- `VITE_DATA_MODE=local`, API `http://127.0.0.1:5175`, database `.local/travel-planner.sqlite`
- Seed login: `demo@travelplanner.local` / `TravelPlanner123!`
- `LOCAL_DB_PATH` / `LOCAL_API_PORT` override the defaults

## Current Status and Continuation Notes
Last updated: 2026-09-13.

### Completed in Code
- Restructured the app around the board flow: Landing → Sign in / Demo → Dashboard → New Trip → Trip Board.
- Built the React Flow board with catalog sidebar drag-and-drop, route edges with vehicle picker and duration estimates, persistence, keyboard delete, minimap and a themed canvas.
- Added the Malaysia catalog (42 places), three seeded boards, generated SVG illustrations and the `npm run art` generator.
- Added the News page with per-user likes (local API + demo mode).
- Added the popular-places dashboard banner and region cover art on trip cards.
- Applied the seaside palette across the app with semantic tokens; dark mode uses the navy variant.
- Removed Budget, Packing, To-Dos, Essentials, Sharing and Settings (views, routes, tables, tests).
- Split the old 1,400-line `travelData.ts` into contract + three clients; removed dead `isReadOnly` branches; React Flow, Leaflet, Supabase and React now build into separate chunks (no bundle-size warning).
- Rewrote the PDF export around the board (places in route order with legs).

### Verified
- `npm test` (35 tests), `npm run lint`, `npm run build` pass.
- Browser-driven checks (Playwright, headless Chromium): landing → demo → dashboard → board; drag/drop, "+" add, connect, vehicle change, node move, node delete with route cascade, reload persistence; local sign-in → new trip → board → PDF download; News like persists across reload; dark mode; mobile sidebar toggle; Collections.

### Known Limitations / Next Ideas
- Place images are generated illustrations, not photos; reviews are sample data (no Google scraping in the prototype).
- Leg times are straight-line estimates, not routed directions.
- Remote (Supabase) mode does not support the board or News yet.
- Possible next steps: auto-layout button, day grouping on the board, real photos via a licensed source, sharing a read-only board link.

### Notes for Next Session
- Do not put secret keys in frontend `.env` files or committed documentation.
- Changing `shared/*.json` place ids requires re-running `npm run art` and checking the seed references (`catalog.test.ts` and `demoTravelData.test.ts` cover this).
- Bump `schemaVersion` in `server/db.mjs` when the SQLite schema changes; the local database is reset, not migrated.
