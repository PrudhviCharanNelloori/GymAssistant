# AI Context — Gym Workout Tracker

> Handoff document for AI coding tools. Keep concise and current.

## Product Purpose

Mobile-first Angular PWA for gym workout execution and tracking. Replaces cognitive overhead of remembering workout plans during gym sessions.

## Current Phase

**Phase 1 complete.** Phase 2 (persistence) is next.

## MVP Scope

Workout setup, exercise library, workout execution, completion summary, history, progress. Single user. Offline-first. No social, AI, nutrition, or backend.

## Architecture

- Angular 22, standalone components, lazy routes
- SCSS design tokens in `src/app/shared/styles/`
- Dexie.js IndexedDB (schema stub only)
- Angular PWA with service worker
- Feature folders: home, workout, workout-builder, exercises, history, progress, settings

## Domain Model

Key entities: User, Exercise, WorkoutProgram, Workout, WorkoutSession. Plan (Workout) and execution (WorkoutSession) are separate. Exercises use flexible MetricValue tracking.

Types in `src/app/core/models/`.

## Implementation Status

| Area | Status |
|------|--------|
| Angular project | Done |
| Documentation | Done |
| Domain models | Done |
| Folder structure | Done |
| Design tokens | Done |
| App shell + bottom nav | Done |
| PWA manifest + SW | Done |
| Dexie schema stub | Done |
| IndexedDB CRUD | Not started |
| Exercise library | Not started |
| Workout builder | Not started |
| Active workout | Not started |
| History/Progress | Not started |

## Key Files

- `docs/` — product, domain, architecture, data model docs
- `src/app/core/models/` — all domain types
- `src/app/core/storage/database.ts` — Dexie schema
- `src/app/app.routes.ts` — lazy-loaded feature routes
- `src/app/shared/components/bottom-nav/` — main navigation

## Important Decisions

- IndexedDB via Dexie, no backend
- SCSS tokens, no UI framework
- Signals + services, no NgRx
- Plan/session separation for data integrity
- GitHub: `PrudhviCharanNelloori/GymAssistant`

## Known Limitations

- No data persistence yet (schema only)
- Placeholder screens for all features except home
- No exercise seed data
- Service worker disabled in dev mode

## Next Planned Work (Phase 2)

1. Implement Dexie CRUD services for all entities
2. Bootstrap default single user
3. Unit tests for storage layer

## Current Task

Phase 1 foundation complete. Awaiting instruction to begin Phase 2.
