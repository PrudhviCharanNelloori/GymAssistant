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
import { createWorkoutExercise } from '../utils';
import { ActiveWorkoutService } from './active-workout.service';
import { ExerciseService } from './exercise.service';
import { RestTimerService } from './rest-timer.service';
import { WorkoutProgramService } from './workout-program.service';
import { WorkoutService } from './workout.service';

describe('ActiveWorkoutService', () => {
  let db: AppDatabase;
  let active: ActiveWorkoutService;
  let workouts: WorkoutService;
  let exercises: ExerciseRepository;
  let timer: RestTimerService;

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
        RestTimerService,
        ActiveWorkoutService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    active = TestBed.inject(ActiveWorkoutService);
    workouts = TestBed.inject(WorkoutService);
    exercises = TestBed.inject(ExerciseRepository);
    timer = TestBed.inject(RestTimerService);

    await db.open();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  afterEach(async () => {
    timer.stop();
    await Promise.all(db.tables.map((table) => table.clear()));
    db.close();
  });

  async function seedWorkout() {
    const bench = await exercises.createExercise({
      name: 'Bench Press',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });
    const row = await exercises.createExercise({
      name: 'Barbell Row',
      primaryMuscleGroup: MuscleGroup.BACK,
      secondaryMuscleGroups: [],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });

    return workouts.createWorkout({
      name: 'Test Day',
      exercises: [
        createWorkoutExercise(bench, 0, { setCount: 2, restSeconds: 60 }),
        createWorkoutExercise(row, 1, { setCount: 1, restSeconds: 45 }),
      ],
    });
  }

  it('starts a session and completes sets through the workout', async () => {
    const workout = await seedWorkout();
    await TestBed.inject(ExerciseService).load();

    const session = await active.startWorkout(workout.id);
    expect(session.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
    expect(active.view()?.exercise?.name).toBe('Bench Press');
    expect(active.view()?.setCount).toBe(2);

    const afterFirst = await active.completeSet();
    expect(afterFirst).toBe('rest');
    expect(timer.isActive()).toBe(true);
    expect(active.currentSetIndex()).toBe(1);

    timer.skip();
    const afterSecond = await active.completeSet();
    expect(afterSecond).toBe('next-exercise');
    expect(active.currentExerciseIndex()).toBe(1);

    timer.skip();
    const done = await active.completeSet();
    expect(done).toBe('completed');
    expect(active.activeSession()?.status).toBe(WorkoutSessionStatus.COMPLETED);
  });

  it('skips sets and exercises', async () => {
    const workout = await seedWorkout();
    await TestBed.inject(ExerciseService).load();
    await active.startWorkout(workout.id);

    await active.skipSet();
    expect(active.currentSetIndex()).toBe(1);

    await active.skipExercise();
    expect(active.currentExerciseIndex()).toBe(1);
    expect(active.currentSetIndex()).toBe(0);
  });

  it('pauses and resumes a session', async () => {
    const workout = await seedWorkout();
    await TestBed.inject(ExerciseService).load();
    await active.startWorkout(workout.id);

    await active.pause();
    expect(active.isPaused()).toBe(true);

    await active.resume();
    expect(active.isPaused()).toBe(false);
    expect(active.activeSession()?.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
  });
});
