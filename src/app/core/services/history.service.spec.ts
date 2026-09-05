import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  Equipment,
  MuscleGroup,
  SetType,
  TrackingMetric,
  WorkoutSessionStatus,
} from '../models';
import {
  AppDatabase,
  ExerciseRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
  WorkoutSessionRepository,
} from '../storage';
import { createId, createWorkoutExercise } from '../utils';
import { ExerciseService } from './exercise.service';
import { HistoryService } from './history.service';
import { WorkoutProgramService } from './workout-program.service';
import { WorkoutService } from './workout.service';

describe('HistoryService', () => {
  let db: AppDatabase;
  let history: HistoryService;
  let workouts: WorkoutService;
  let exercises: ExerciseRepository;
  let sessions: WorkoutSessionRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AppDatabase,
        ExerciseRepository,
        WorkoutRepository,
        WorkoutProgramRepository,
        WorkoutSessionRepository,
        ExerciseService,
        WorkoutService,
        WorkoutProgramService,
        HistoryService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    history = TestBed.inject(HistoryService);
    workouts = TestBed.inject(WorkoutService);
    exercises = TestBed.inject(ExerciseRepository);
    sessions = TestBed.inject(WorkoutSessionRepository);

    await db.open();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  afterEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    db.close();
  });

  async function seedCompletedSession() {
    const bench = await exercises.createExercise({
      name: 'Bench Press',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });

    const workout = await workouts.createWorkout({
      name: 'Push Day',
      exercises: [createWorkoutExercise(bench, 0, { setCount: 2, restSeconds: 60 })],
    });

    const startedAt = new Date('2026-03-01T09:00:00Z');
    const completedAt = new Date('2026-03-01T09:30:00Z');
    const workoutExerciseId = workout.exercises[0].id;

    const session = await sessions.createSession({
      workoutId: workout.id,
      startedAt,
      status: WorkoutSessionStatus.COMPLETED,
      exercises: [
        {
          id: createId(),
          exerciseId: bench.id,
          workoutExerciseId,
          order: 0,
          sets: [
            {
              id: createId(),
              setNumber: 1,
              setType: SetType.NORMAL,
              completed: true,
              actualMetrics: [
                { metric: TrackingMetric.WEIGHT, value: 80 },
                { metric: TrackingMetric.REPS, value: 5 },
              ],
              completedAt,
            },
            {
              id: createId(),
              setNumber: 2,
              setType: SetType.NORMAL,
              completed: true,
              actualMetrics: [
                { metric: TrackingMetric.WEIGHT, value: 85 },
                { metric: TrackingMetric.REPS, value: 3 },
              ],
              completedAt,
            },
          ],
        },
      ],
    });

    await sessions.updateSession(session.id, { completedAt });

    return { bench, workout, session: { ...session, completedAt } };
  }

  it('loads completed sessions for the history list', async () => {
    const { workout, session } = await seedCompletedSession();
    await history.load();

    expect(history.count()).toBe(1);
    expect(history.history()[0].session.id).toBe(session.id);
    expect(history.history()[0].workoutName).toBe(workout.name);
    expect(history.history()[0].stats.volumeKg).toBe(655);
  });

  it('returns session detail with per-set labels', async () => {
    const { session } = await seedCompletedSession();
    const detail = await history.getSessionDetail(session.id);

    expect(detail).not.toBeNull();
    expect(detail!.exercises).toHaveLength(1);
    expect(detail!.exercises[0].name).toBe('Bench Press');
    expect(detail!.exercises[0].sets[0].label).toBe('80 kg × 5');
  });

  it('returns exercise history with best set', async () => {
    const { bench, session } = await seedCompletedSession();
    const exerciseHistory = await history.getExerciseHistory(bench.id);

    expect(exerciseHistory).not.toBeNull();
    expect(exerciseHistory!.sessionCount).toBe(1);
    expect(exerciseHistory!.entries[0].sessionId).toBe(session.id);
    expect(exerciseHistory!.bestSetLabel).toBe('80 kg × 5');
  });
});
