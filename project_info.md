# Project Information: Travel Planner

## Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with class-based light/dark mode
- **Language**: TypeScript
- **Backend/Database/Auth**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth 2.0 (via Supabase Auth)
- **State Management**: React Context API (for Auth and Theme)

## Development Commands
- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Preview**: `npm run preview`
- **Tests**: `npm test`

## Core Functionalities

### 1. Trip Management
- **Dashboard**: A centralized hub to view all upcoming and past trips.
- **Trip Creation**: Ability to set destination, start date, end date, and description.

### 2. Planning Tools (Per Trip)
- **Itinerary Builder**: 
    - Day-by-day activity scheduling.
    - Ability to add activity name, start/end times, and notes.
    - Sortable items for flexible planning.
- **Places & Map**:
    - Save trip places with address, coordinates, notes, rating, and source.
    - Search OpenStreetMap/Nominatim results from the client and save selected locations.
- **Collections**:
    - Save destinations the user has visited or wants to turn into future trips.
    - Store dates, times, confirmation codes, status, and notes.
- **Budget Tracker**:
    - Expense ledger with categories (Flight, Hotel, Food, etc.).
    - Amount tracking and payment status (Paid/Planned).
- **Packing Checklist**:
    - Categorized lists of items to bring.
    - Simple toggle for "packed" status.
- **Quick-Info**:
    - Dedicated space for confirmation numbers, addresses, and local emergency contacts.
- **To-Dos**:
    - Trip tasks with priority, due dates, and completion state.
- **Sharing**:
    - Invite trip members by email with owner/member roles.

### 3. User Experience Features
- **Jakob's Law Compliance**: Use of familiar UI patterns to minimize learning curve.
- **Appearance Toggle**: Global Light/Dark mode switch using Tailwind CSS.
- **Demo/Trial Mode**: Read-only access to a pre-seeded trip to showcase functionality without requiring authentication.
- **Installable App Basics**: PWA manifest and app metadata for a more native-feeling experience.
- **Saved Collections**: User-owned saved destinations marked as visited or want-to-go.

## Application Architecture
- `src/pages/`: Top-level views (`LandingPage`, `AuthPage`, `Dashboard`, `TripDetail`, `DemoRedirect`).
- `src/components/`: Domain-specific UI for dashboard and trip planning workflows.
- `src/contexts/AuthContext.tsx`: Supabase session, Google sign-in, profile loading, and demo-mode state.
- `src/contexts/ThemeContext.tsx`: Global light/dark preference, root class sync, and persistence.
- `src/services/travelData.ts`: Typed service boundary between the React UI and Supabase/demo data.
- `src/lib/supabase.ts`: Supabase client initialization from Vite environment variables.
- `src/types/database.ts`: Typed database row and insert/update contracts.

## Supabase Configuration
- **Project URL**: `https://sevubkrirbaitcikpcjk.supabase.co`
- **Client env vars**:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
- Use only the publishable/anon key in frontend code. Never place a service-role or secret key in Vite client env vars.
- Google OAuth also requires enabling the Google provider in the Supabase dashboard with a Google OAuth Client ID and Client Secret.
- Supabase redirect URLs must include local and production app URLs used by `signInWithOAuth`.

## Database Architecture
- `profiles`: User profile extensions.
- `trips`: Main trip entity.
- `itinerary_items`: Linked to trips, supporting day-based organization.
- `budget_items`: Linked to trips, supporting category-based tracking.
- `packing_items`: Linked to trips, supporting simple boolean tracking.
- `trip_infos`: Linked to trips, storing confirmations, addresses, links, and emergency info.
- `places`: Linked to trips, storing map/search locations.
- Remote-only legacy note: an earlier iteration created a `reservations` table in Supabase. It has been removed from the local app contract and schema file because the product is planning-only. Use a dedicated drop migration later if that remote legacy table should be permanently removed.
- `trip_todos`: Linked to trips, storing task state.
- `trip_members`: Linked to trips, storing invite/share records.
- `user_settings`: Linked to profiles, storing user preferences.
- `trip_collections`: User-owned saved destinations for visited and want-to-go places.

All exposed public tables must have Row Level Security enabled. User-owned rows are scoped by `auth.uid()` directly or through the owning trip.

## Current Status and Continuation Notes
Last updated: 2026-09-12.

### Completed in Code
- Merged the important project instructions from `CLAUDE.md` into this file and removed `CLAUDE.md`.
- Implemented class-based light/dark theme support with persisted preference.
- Added shared minimalist black/white travel planner branding via `BrandMark`.
- Replaced the browser/favicon icon with the minimalist black/white travel icon.
- Expanded the landing page with more product explanation before sign-in.
- Added Supabase client configuration through Vite environment variables.
- Implemented Google OAuth sign-in from the app side.
- Added trip planning features for places/map search, todos, sharing, settings, and saved trip collections.
- Added Supabase schema support for `trip_collections`.
- Moved saved collections to their own `/collections` page and added the page to the authenticated top navigation.
- Moved the `New Trip` action to a fixed bottom-right floating button.
- Removed the booking/reservation workflow from the visible app UI and local app data contract.
- Replaced the profile image fallback with a plain minimalist grey/white avatar.

### Verified
- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Supabase database migrations were applied and verified for the core travel planner schema and `trip_collections`.

### Known Setup Issue
- Google sign-in currently fails with `Unsupported provider: provider is not enabled`.
- This is a Supabase dashboard configuration issue, not a React code issue.
- Enable the Google provider in Supabase Auth using a Google OAuth Client ID and Client Secret.
- Add this Google authorized redirect URI: `https://sevubkrirbaitcikpcjk.supabase.co/auth/v1/callback`.
- Add local and production app URLs to the Supabase redirect allow-list, for example `http://localhost:5173/**` and the deployed site URL.

### Pending Implementation Items
- Add a friendlier in-app error message when Google OAuth is disabled or misconfigured.
- Add a fuller footer to the landing page.
- Add a custom circular loading transition for buttons/links that navigate to another page.
- Keep the existing saved collections feature, then polish the collection creation/editing flow if more control is needed.

### Notes for Next Session
- Do not put secret keys in frontend `.env` files or committed documentation.
- The frontend should only use the Supabase URL and publishable/anon key.
- A Vite dev server was previously started on `http://127.0.0.1:5174/` because port `5173` was already occupied.
- Build currently succeeds with a large chunk warning after adding Supabase and Leaflet. A future improvement is route-level code splitting, especially around map components.
