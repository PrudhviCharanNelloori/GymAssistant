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
import { ProgressService } from './progress.service';
import { WorkoutProgramService } from './workout-program.service';
import { WorkoutService } from './workout.service';

describe('ProgressService', () => {
  let db: AppDatabase;
  let progress: ProgressService;
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
        ProgressService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    progress = TestBed.inject(ProgressService);
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

  it('loads overview with counts, PRs, and selectable progression', async () => {
    const bench = await exercises.createExercise({
      name: 'Bench Press',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });

    const workout = await workouts.createWorkout({
      name: 'Push',
      exercises: [createWorkoutExercise(bench, 0, { setCount: 1, restSeconds: 60 })],
    });

    const completedAt = new Date();
    await sessions.createSession({
      workoutId: workout.id,
      startedAt: new Date(completedAt.getTime() - 30 * 60_000),
      status: WorkoutSessionStatus.COMPLETED,
      exercises: [
        {
          id: createId(),
          exerciseId: bench.id,
          workoutExerciseId: workout.exercises[0].id,
          order: 0,
          sets: [
            {
              id: createId(),
              setNumber: 1,
              setType: SetType.NORMAL,
              completed: true,
              actualMetrics: [
                { metric: TrackingMetric.WEIGHT, value: 100 },
                { metric: TrackingMetric.REPS, value: 5 },
              ],
              completedAt,
            },
          ],
        },
      ],
    }).then((session) => sessions.updateSession(session.id, { completedAt }));

    const overview = await progress.load();
    expect(overview.volume.workoutCount).toBe(1);
    expect(overview.volume.totalKg).toBe(500);
    expect(overview.personalRecords[0].exerciseName).toBe('Bench Press');
    expect(overview.trackedExercises[0].id).toBe(bench.id);
    expect(progress.selectedProgression().length).toBe(1);
  });
});
