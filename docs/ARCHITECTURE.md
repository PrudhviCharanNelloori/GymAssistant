# Architecture

## Stack

- Angular 22 (standalone components)
- TypeScript (strict)
- SCSS design tokens
- Dexie.js (IndexedDB wrapper)
- Angular PWA (service worker)

## Folder Structure

```
src/app/
├── core/
│   ├── models/       # Domain interfaces and enums
│   ├── services/     # Business logic (bootstrap, later session/timer)
│   ├── storage/      # IndexedDB via Dexie + repositories
│   │   └── repositories/
│   ├── state/        # Active workout state
│   └── utils/        # Shared helpers (IDs, etc.)
├── shared/
│   ├── components/   # Reusable UI components
│   ├── directives/
│   ├── pipes/
│   └── styles/       # Design tokens
├── features/
│   ├── home/
│   ├── workout/
│   ├── workout-builder/
│   ├── exercises/
│   ├── history/
│   ├── progress/
│   └── settings/
├── app.routes.ts
├── app.config.ts
└── app.ts
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| Components | Display UI, capture interaction, trigger actions |
| Services | Business operations, calculations, session management |
| Storage | IndexedDB access via repositories (`Repository<T>` abstraction), queries, transactions |
| State | Active workout, current exercise/set, timer state |
| Models | Domain contracts only |

Components must not contain complex business logic.

## Persistence

- Dexie `AppDatabase` is the IndexedDB entry point
- Entity repositories: User, Exercise, Workout, WorkoutProgram, WorkoutSession
- `BootstrapService` creates the default single user (`default-user`) on first launch
- Stable string IDs via `createId()` for future sync

## Routing

Lazy-loaded feature routes. Bottom navigation for main sections. Workout routes accessible without nav tab.

## State Management

Signals + services for MVP. No NgRx. Active workout state persisted frequently to IndexedDB.

## Rest Timer

Runtime state managed by a dedicated service (Phase 5). `WorkoutExercise.restSeconds` provides configured duration. Timer supports start, pause, resume, skip, add/reduce time. Decoupled from UI components.

## Progress

Derived from historical WorkoutSessions in dedicated services. No redundant progress tables in MVP.

## Offline-First

IndexedDB (Dexie) is the primary store for all workout data. The Angular service worker:

- Prefetches the app shell, icons, and static assets
- Caches Google Fonts for offline typography after first load
- Serves SPA navigation offline via `navigationUrls`

`PwaService` tracks online/offline state, install prompts, service-worker updates, and verifies local data readiness (default user + exercise library).

## Cloud Sync (Supabase)

No custom API. The PWA talks to Supabase Auth + Postgres via `@supabase/supabase-js` (anon key only).

- **Local-first:** Dexie remains source of truth offline; dirty rows sync when online
- **Auth:** Email/password and Google OAuth (`AuthService`); app routes require sign-in via `authGuard`
- **RLS:** Every cloud table scoped with `auth.uid() = user_id` (built-in exercises may be `user_id null` for shared read)
- **Conflict:** Last-write-wins on `updated_at`
- **Claim:** On first login, anonymous local `default-user` data is reassigned to `auth.uid()`
- **Schema:** SQL migration in `supabase/migrations/`; configure URL + anon key in `src/environments/environment.ts`

`SyncService` push/pulls exercises (custom), workouts, programs, and sessions.

## Testing Priority

Business logic: scheduling, set completion, session creation, progress/PR/streak calculations, rest timer, persistence, data integrity.
