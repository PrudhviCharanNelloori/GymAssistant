# Data Model

## TypeScript Models

All domain types live in `src/app/core/models/`.

### Interfaces

- `User`, `Exercise`, `WorkoutProgram`, `WeeklySchedule`
- `Workout`, `WorkoutExercise`, `SetTarget`
- `WorkoutSession`, `ExerciseSession`, `SetResult`
- `MetricValue`

### Enums

- `TrackingMetric`, `SetType`, `WorkoutSessionStatus`
- `MuscleGroup`, `Equipment`, `DayOfWeek`

## IndexedDB Schema (Dexie)

Database: `GymAssistantDB` (version 2)

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| users | id | userId, dirty |
| exercises | id | name, primaryMuscleGroup, isCustom, userId, dirty, updatedAt |
| workoutPrograms | id | isActive, userId, dirty, updatedAt |
| workouts | id | name, userId, dirty, updatedAt |
| workoutSessions | id | workoutId, status, startedAt, userId, dirty, updatedAt |
| syncState | id | — |

Defined in `src/app/core/storage/database.ts`.

## Supabase (Postgres)

Migration: `supabase/migrations/20260906120000_init_gymtracker_schema.sql`

| Table | Notes |
|-------|-------|
| profiles | id = auth.users.id |
| exercises | JSON arrays for secondary muscles/equipment/metrics; `user_id` null = global |
| workouts | `exercises` JSONB |
| workout_programs | `schedule` JSONB |
| workout_sessions | `exercises` JSONB snapshot |

RLS enabled on all tables. Client uses anon key only.

## Persistence Strategy

- IndexedDB via Dexie.js as primary local store
- Built-in exercise catalog (~45 RepDB staples + local WebP images); see `docs/THIRD-PARTY-NOTICES.md`
- Supabase as cloud replica + Auth (direct client, no custom API)
- Stable string IDs for all entities
- Nested objects acceptable locally and as JSONB in cloud
- Soft-delete locally (`deletedAt`) until sync pushes `deleted_at`

## Date Handling

Models use `Date` type. Dexie stores dates natively. Cloud sync maps to ISO strings via `sync-mappers.ts`.

## Historical Integrity

WorkoutSession snapshots exercise and set data at execution time. References to `workoutId` and `workoutExerciseId` link back to plans but session data is self-contained.

## Future AI Data Requirements

Preserve: workout frequency, exercise performance, weight/rep progression, volume, PRs, missed workouts, duration, exercise history.
