# Gym Workout Tracker

A mobile-first Angular PWA for personal gym workout execution and tracking.

## Repository

https://github.com/PrudhviCharanNelloori/GymAssistant.git

## Development

```bash
npm install
npm start        # dev server at http://localhost:4200 (service worker off)
npm run build    # production build with service worker
npm test         # unit tests
```

### Supabase (auth + cloud sync)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in [`supabase/migrations/20260906120000_init_gymtracker_schema.sql`](supabase/migrations/20260906120000_init_gymtracker_schema.sql) (SQL editor or `npx supabase db push`)
3. Copy **Project URL** and **anon public** key into [`src/environments/environment.ts`](src/environments/environment.ts) (and `environment.prod.ts` for production)
4. Enable **Email** and/or **Google** under Authentication → Providers
5. Sign in from **Profile → Sign in** (email or Google), then use **Sync now**

#### Google OAuth setup

1. In [Google Cloud Console](https://console.cloud.google.com/) create an OAuth client (type **Web application**)
2. Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Copy Client ID + Client Secret into Supabase → Authentication → Providers → Google
4. In Supabase → Authentication → URL Configuration, add redirect URLs:
   - `http://localhost:4200/home` (local Angular)
   - your production origin + `/home` when deployed

Local IndexedDB still works offline without keys. Sync runs when signed in and online.

### Offline / install testing

1. `npm run build` then serve `dist/gym-assistant/browser` over HTTPS or `localhost`
2. Open Chrome DevTools → Application → Service Workers / Manifest
3. Use Network → Offline to confirm home, workouts, and history still load from IndexedDB + cached shell
4. Install prompt appears when the browser fires `beforeinstallprompt` (Chrome/Edge); Settings also has **Install app**

### Sync checklist

- [ ] Sign up / sign in (email or Google)
- [ ] Create workout offline, go online, Sync now — row appears in Supabase `workouts`
- [ ] Complete a session, sync — appears in `workout_sessions`
- [ ] Second device / browser profile: sign in, sync — data pulls down
- [ ] Sign out — local data remains; cloud protected by RLS

## Documentation

See [`docs/`](docs/) for product requirements, architecture, domain model, and roadmap.

## Tech Stack

- Angular 22 (standalone, strict TypeScript)
- SCSS design tokens + Space Grotesk
- Dexie.js (IndexedDB, offline-first)
- Supabase Auth + Postgres (direct client, RLS)
- Angular PWA (service worker + install/update UX)

## Current Status

Phases 1–9 complete, plus Supabase auth/sync. See [ROADMAP.md](docs/ROADMAP.md).
