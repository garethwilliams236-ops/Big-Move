# Big Move

Shared household app for Gareth and Kristin to manage the move out of Fulham — a London flat plus a country house — by March 2027.

**Stack:** Next.js 15 (App Router) · Supabase (auth + Postgres with RLS) · Tailwind v4 · Claude API · Vercel

## Tabs
- **Overview** – countdown, checklist progress, next two weeks, possessions split, top properties
- **To-Do** – master checklist, filter by who / category / status
- **Diary** – month calendar and agenda of tasks and appointments
- **Possessions** – room-by-room inventory; destination (London / country / storage / sell / donate / dispose), packing status, box labels
- **Properties** – London and country options, separate scores for Gareth and Kristin, side-by-side compare
- **Budget** – sale proceeds vs purchases and moving costs, estimate vs actual
- **Contacts** – agents, solicitors, removals, storage
- **Ask Claude** – shared chat that can see the app's data
- **Settings** – add household members, change password

## Setup
1. Supabase → SQL editor → run `supabase/setup.sql` (schema + starter checklist). `schema.sql` / `seed.sql` are the same, split.
2. Vercel → import repo → set env vars from `.env.example` (`ANTHROPIC_API_KEY` is required for Ask Claude).
3. Supabase → Authentication → URL configuration → set Site URL to the Vercel URL.
4. Sign up in the app with an email listed in `members`; add Kristin from Settings.

## Dev
```
npm install
npm run dev        # http://localhost:3080
npm run typecheck
```
