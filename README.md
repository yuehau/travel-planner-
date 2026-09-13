# Cuti²

A streamlined, intuitive travel planning application designed to help users organize their trips without the clutter. Built with a focus on high-value functionality and a familiar user experience.

## Objective
The goal of this project is to provide a minimalist tool that solves the "Three Pillars of Planning": **Where/When**, **What**, and **How Much**. By following Jakob's Law, the application leverages common design patterns so that users can start planning their journeys immediately without a steep learning curve.

## Key Features
- **Intuitive Dashboard**: Manage all your trips in one place.
- **Collections Page**: Save places you have visited or want to turn into future trips.
- **Day-by-Day Itinerary**: Plan your activities with a simple, vertical timeline.
- **Map & Places**: Search OpenStreetMap places, save markers, and attach saved places to itinerary items.
- **Expense Tracking**: Keep your travel budget in check with a minimalist ledger.
- **Smart Packing Lists**: Ensure nothing is left behind with categorized checklists.
- **To-Dos & Sharing**: Manage trip tasks and invite collaborators.
- **Quick-Access Info**: Store addresses, links, local notes, emergency contacts, and other trip essentials.
- **Zero-Friction Trial**: Try the app instantly via a read-only demo account.
- **Modern UI**: Full support for Light and Dark modes.
- **Planning-Only Product Scope**: The app helps users plan and organize trips; it does not provide booking or reservation flows.

## Current Progress
- Built the React/Vite/Tailwind application shell with authenticated routing.
- Integrated Supabase configuration for Auth and PostgreSQL data access.
- Added Google sign-in from the app side. Supabase still needs Google provider setup in the dashboard before OAuth will work end-to-end.
- Added class-based light/dark mode with persistent user preference.
- Added dashboard trip search, stats, next-focus summary, trip cards, and a fixed bottom-right `New Trip` action.
- Moved saved destination collections into a dedicated `/collections` page with top navigation beside `My Trips`.
- Added planning tabs for itinerary, places, budget, packing, to-dos, essentials, sharing, and settings.
- Removed the visible booking/reservation workflow so the platform stays focused on trip planning.
- Added demo-mode data and read-only protection for trial exploration.
- Added tests for theme storage, Supabase client config, demo data behavior, trip status logic, and the planning-only tab contract.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel/Netlify

## Getting Started
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `VITE_SUPABASE_URL=https://sevubkrirbaitcikpcjk.supabase.co`.
4. Set `VITE_SUPABASE_ANON_KEY` to the Supabase publishable or anon key.
5. Set `VITE_APP_URL=http://localhost:5173` for local development.
6. Run `npm run dev`.

## Google Sign-In Setup
The app code starts Google OAuth through Supabase. The Supabase dashboard must also be configured:

- Enable the Google provider under Authentication > Providers.
- Add the Google OAuth Client ID and Client Secret.
- Add this authorized redirect URI in Google Cloud: `https://sevubkrirbaitcikpcjk.supabase.co/auth/v1/callback`.
- Add local and production app URLs to Supabase Authentication > URL Configuration. For local Vite development, include `http://localhost:5173/**`.

## Development Commands
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm test`

## License
MIT
