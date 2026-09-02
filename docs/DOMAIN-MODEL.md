# Domain Model

## Entities

| Entity | Description |
|--------|-------------|
| User | Application user (single user in MVP) |
| Exercise | Reusable exercise in the library |
| WorkoutProgram | Named program with weekly schedule |
| WeeklySchedule | Day-of-week assignment to workout or rest |
| Workout | Reusable workout plan |
| WorkoutExercise | Exercise within a workout plan |
| SetTarget | Planned set with target metrics |
| WorkoutSession | Historical execution of a workout |
| ExerciseSession | Exercise within a session |
| SetResult | Actual set performance |
| MetricValue | A tracked metric value (weight, reps, etc.) |

## Enums

- **TrackingMetric**: WEIGHT, REPS, DURATION, DISTANCE, TIME, RPE, ASSISTANCE_WEIGHT, BODY_WEIGHT, CALORIES
- **SetType**: NORMAL, WARMUP, DROP_SET, FAILURE, AMRAP, REST_PAUSE
- **WorkoutSessionStatus**: PLANNED, IN_PROGRESS, PAUSED, COMPLETED, ABANDONED
- **MuscleGroup**, **Equipment**, **DayOfWeek**

## Relationships

```
User
└── WorkoutProgram
    └── WeeklySchedule → workoutId
└── Workout
    └── WorkoutExercise → exerciseId
        └── SetTarget

User
└── WorkoutSession → workoutId
    └── ExerciseSession → exerciseId, workoutExerciseId
        └── SetResult
```

## Plan vs Session

| Concept | Entity | Mutable | Purpose |
|---------|--------|---------|---------|
| Plan | Workout | Yes | Template for future sessions |
| Execution | WorkoutSession | Immutable after completion | Historical record |

Example: Bench Press planned as 4×8–10. Actual session records 60kg×10, 60kg×10, 62.5kg×8, 62.5kg×7. If the plan changes later, the session data remains unchanged.

## Metric Flexibility

Exercises define which metrics they track. Do not hard-code weight+reps globally.

- Bench Press: weight + reps
- Plank: duration
- Pull-up: reps + assistance weight
- Running: distance + duration

## Data Integrity Rules

1. Historical sessions are never modified when plans change
2. Deleting/modifying an Exercise must not corrupt historical sessions
3. Plan data and execution data remain conceptually separate
4. No destructive cascading without explicit consideration
