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

Database: `GymAssistantDB` (version 1)

| Table | Primary Key | Indexes |
|-------|-------------|---------|
| users | id | — |
| exercises | id | name, primaryMuscleGroup, isCustom |
| workoutPrograms | id | isActive |
| workouts | id | name |
| workoutSessions | id | workoutId, status, startedAt |

Defined in `src/app/core/storage/database.ts`. CRUD services planned for Phase 2.

## Persistence Strategy

- IndexedDB via Dexie.js as primary local store
- No backend in MVP
- Stable UUIDs for all entities
- Relationships via ID references
- Nested objects (e.g., WorkoutExercise within Workout) acceptable for local simplicity

## Date Handling

Models use `Date` type. Dexie stores dates natively. Services handle serialization if needed for future sync.

## Historical Integrity

WorkoutSession snapshots exercise and set data at execution time. References to `workoutId` and `workoutExerciseId` link back to plans but session data is self-contained.

## Future AI Data Requirements

Preserve: workout frequency, exercise performance, weight/rep progression, volume, PRs, missed workouts, duration, exercise history.
