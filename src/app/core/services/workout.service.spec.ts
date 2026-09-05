import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  Equipment,
  MuscleGroup,
  TrackingMetric,
} from '../models';
import {
  AppDatabase,
  ExerciseRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
} from '../storage';
import { createWorkoutExercise } from '../utils';
import { WorkoutProgramService } from './workout-program.service';
import { WorkoutService } from './workout.service';

describe('Workout builder services', () => {
  let db: AppDatabase;
  let workouts: WorkoutService;
  let programs: WorkoutProgramService;
  let exerciseRepo: ExerciseRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AppDatabase,
        WorkoutRepository,
        WorkoutProgramRepository,
        ExerciseRepository,
        WorkoutService,
        WorkoutProgramService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    workouts = TestBed.inject(WorkoutService);
    programs = TestBed.inject(WorkoutProgramService);
    exerciseRepo = TestBed.inject(ExerciseRepository);

    await db.open();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  afterEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    db.close();
  });

  it('creates workouts and updates exercise order summaries', async () => {
    const exercise = await exerciseRepo.createExercise({
      name: 'Bench Press',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [Equipment.BARBELL],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: false,
    });

    const workout = await workouts.createWorkout({
      name: 'Push',
      exercises: [createWorkoutExercise(exercise, 0)],
    });

    await workouts.load();
    expect(workouts.workoutCount()).toBe(1);

    const summary = workouts.summary(workout);
    expect(summary.exerciseCount).toBe(1);
    expect(summary.setCount).toBe(3);
    expect(summary.minutes).toBeGreaterThan(0);

    await workouts.updateWorkout(workout.id, { name: 'Push Day' });
    expect((await workouts.getById(workout.id))?.name).toBe('Push Day');
  });

  it('ensures an active program and assigns workouts to days', async () => {
    const workout = await workouts.createWorkout({ name: 'Pull' });
    const program = await programs.load();

    expect(program.isActive).toBe(true);
    expect(program.schedule).toHaveLength(7);

    await programs.assignDay(program.schedule[0].dayOfWeek, workout.id, false);
    expect(programs.schedule()[0].workoutId).toBe(workout.id);
    expect(programs.schedule()[0].isRestDay).toBe(false);

    await programs.assignDay(program.schedule[0].dayOfWeek, null, true);
    expect(programs.schedule()[0].isRestDay).toBe(true);
  });
});
