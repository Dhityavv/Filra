# Filra - Film Rating

Filra is a responsive movie discovery and rating app built with Next.js, TMDB, Clerk, and Supabase. Users can browse films without an account; signing in adds a profile, synced ratings/watchlist, and friend features.

## Features

- Search, genre/year filters, sorting, and automatic movie pagination
- Movie details, Indonesian synopsis fallback, ratings, and short reviews
- Clerk sign-in with Google and email/password
- Custom public profile: username, display name, bio, and website link
- Search for users, send/accept friend requests, and view public profiles
- Ratings and reviews are public; each user's watchlist remains private
- Signed-in ratings and watchlists sync by account; guest data stays in that browser
- Dark and comfortable light themes
- Filra Arcade with five movie mini games, daily challenges, XP progression, achievements, stats, and leaderboards

## Configure services

### 1. Clerk

Create a Clerk application and enable Google and email/password sign-in. Add these environment variables to local development and to Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

In the Clerk dashboard, allow your local and production app domains. Configure Google OAuth credentials there if Clerk requests them.

### 2. Supabase

Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. Add these server environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must remain server-side and must never be exposed in browser code. Filra's authenticated Next.js API routes enforce account ownership; the database tables also have row-level security enabled.

### 3. TMDB

Create a TMDB API key and configure it as `TMDB_API_KEY` on Vercel (and locally). The key is used only by the server-side `/api/tmdb` route.

### 4. Filra Arcade

After running `supabase/schema.sql`, run [`supabase/arcade.sql`](./supabase/arcade.sql) in the Supabase SQL Editor. Arcade reuses the existing Clerk, Supabase, and `TMDB_API_KEY` configuration; it does not require additional environment variables.

- Guests can play, but their progression is not saved.
- Signed-in players get server-validated scores, XP, level, streak, achievements, and game history.
- Daily challenges reset at 00:00 UTC. Weekly leaderboard XP is counted from Monday 00:00 UTC.
- Arcade tables have RLS enabled and no client-access policies. All game state and progression writes use server-only Supabase credentials; the service-role key must never be exposed to the browser.
- Game answers and correct scores are kept server-side. The API accepts guesses, not client-calculated score or XP.

### 5. Local development

Copy `.env.example` to `.env.local`, fill in the values from Clerk, Supabase, and TMDB, then run:

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

Set the same environment variables in the Vercel project before deploying. Do not commit `.env.local` or any secret keys.

## Accounts and privacy

- Public profiles show the username, display name, bio, optional website, ratings, and reviews.
- Watchlists are private to the signed-in account.
- Friend requests require the recipient's approval.
- Signed-in account data is stored in Supabase and isolated by Clerk user ID.
- Visitors who are not signed in continue to use browser-local ratings and watchlists.
- Existing browser-local data is not automatically imported into a new account.
- Theme preference remains local to the current browser.

## Data attribution

Movie data and images are provided by [TMDB](https://www.themoviedb.org/). Filra is not endorsed or certified by TMDB.
