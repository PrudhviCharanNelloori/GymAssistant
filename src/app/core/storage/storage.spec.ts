import { TestBed } from '@angular/core/testing';
import {
  DayOfWeek,
  Equipment,
  MuscleGroup,
  SetType,
  TrackingMetric,
  WorkoutSessionStatus,
} from '../models';
import { BootstrapService } from '../services';
import { DEFAULT_USER_ID } from './repositories/user.repository';
import {
  AppDatabase,
  ExerciseRepository,
  UserRepository,
  WorkoutProgramRepository,
  WorkoutRepository,
  WorkoutSessionRepository,
} from './index';

async function clearDatabase(db: AppDatabase): Promise<void> {
  await Promise.all(db.tables.map((table) => table.clear()));
}

describe('Storage layer', () => {
  let db: AppDatabase;
  let users: UserRepository;
  let exercises: ExerciseRepository;
  let workouts: WorkoutRepository;
  let programs: WorkoutProgramRepository;
  let sessions: WorkoutSessionRepository;
  let bootstrap: BootstrapService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        AppDatabase,
        UserRepository,
        ExerciseRepository,
        WorkoutRepository,
        WorkoutProgramRepository,
        WorkoutSessionRepository,
        BootstrapService,
      ],
    });

    db = TestBed.inject(AppDatabase);
    users = TestBed.inject(UserRepository);
    exercises = TestBed.inject(ExerciseRepository);
    workouts = TestBed.inject(WorkoutRepository);
    programs = TestBed.inject(WorkoutProgramRepository);
    sessions = TestBed.inject(WorkoutSessionRepository);
    bootstrap = TestBed.inject(BootstrapService);

    await db.open();
    await clearDatabase(db);
  });

  afterEach(async () => {
    await clearDatabase(db);
    db.close();
  });

  describe('UserRepository', () => {
    it('creates and retrieves a user', async () => {
      const user = await users.createUser({ name: 'Alex' });

      expect(user.id).toBeTruthy();
      expect(user.name).toBe('Alex');
      expect(user.createdAt).toBeInstanceOf(Date);

      const loaded = await users.getById(user.id);
      expect(loaded?.name).toBe('Alex');
    });

    it('updates a user name', async () => {
      const user = await users.createUser({ name: 'Alex' });
      const updated = await users.updateUser(user.id, { name: 'Jordan' });

      expect(updated.name).toBe('Jordan');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
    });

    it('throws when updating a missing user', async () => {
      await expect(users.updateUser('missing', { name: 'X' })).rejects.toThrow(
        'User not found: missing',
      );
    });
  });

  describe('BootstrapService', () => {
    it('creates the default user on first launch', async () => {
      await bootstrap.initialize();

      const user = await users.getDefaultUser();
      expect(user?.id).toBe(DEFAULT_USER_ID);
      expect(user?.name).toBe('Athlete');
    });

    it('seeds built-in exercises on first launch', async () => {
      await bootstrap.initialize();

      const builtIn = await exercises.getBuiltInExercises();
      expect(builtIn.length).toBeGreaterThan(20);
      expect(builtIn.every((exercise) => !exercise.isCustom)).toBe(true);
    });

    it('is idempotent for user and exercise seeds', async () => {
      await bootstrap.initialize();
      const exerciseCount = await exercises.count();

      await bootstrap.initialize();

      expect(await users.count()).toBe(1);
      expect(await exercises.count()).toBe(exerciseCount);
    });
  });

  describe('ExerciseRepository', () => {
    it('creates, updates, searches, and filters exercises', async () => {
      await exercises.createExercise({
        name: 'Bench Press',
        primaryMuscleGroup: MuscleGroup.CHEST,
        secondaryMuscleGroups: [MuscleGroup.TRICEPS],
        equipment: [Equipment.BARBELL],
        trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
        isCustom: false,
      });

      await exercises.createExercise({
        name: 'Cable Fly',
        primaryMuscleGroup: MuscleGroup.CHEST,
        secondaryMuscleGroups: [],
        equipment: [Equipment.CABLE],
        trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
        isCustom: true,
      });

      await exercises.createExercise({
        name: 'Squat',
        primaryMuscleGroup: MuscleGroup.QUADS,
        secondaryMuscleGroups: [MuscleGroup.GLUTES],
        equipment: [Equipment.BARBELL],
        trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
        isCustom: false,
      });

      const search = await exercises.searchByName('bench');
      expect(search).toHaveLength(1);
      expect(search[0].name).toBe('Bench Press');

      const chest = await exercises.getByPrimaryMuscleGroup(MuscleGroup.CHEST);
      expect(chest).toHaveLength(2);

      const custom = await exercises.getCustomExercises();
      expect(custom).toHaveLength(1);
      expect(custom[0].name).toBe('Cable Fly');

      const filtered = await exercises.filter({
        muscleGroup: MuscleGroup.CHEST,
        equipment: Equipment.BARBELL,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Bench Press');

      const updated = await exercises.updateExercise(custom[0].id, {
        name: 'Cable Chest Fly',
      });
      expect(updated.name).toBe('Cable Chest Fly');
    });

    it('bulk creates exercises', async () => {
      const created = await exercises.bulkCreate([
        {
          name: 'Pull Up',
          primaryMuscleGroup: MuscleGroup.BACK,
          secondaryMuscleGroups: [MuscleGroup.BICEPS],
          equipment: [Equipment.BODYWEIGHT],
          trackingMetrics: [TrackingMetric.REPS],
          isCustom: false,
        },
        {
          name: 'Dip',
          primaryMuscleGroup: MuscleGroup.TRICEPS,
          secondaryMuscleGroups: [MuscleGroup.CHEST],
          equipment: [Equipment.BODYWEIGHT],
          trackingMetrics: [TrackingMetric.REPS],
          isCustom: false,
        },
      ]);

      expect(created).toHaveLength(2);
      expect(await exercises.count()).toBe(2);
    });
  });

  describe('WorkoutRepository', () => {
    it('creates workouts and replaces exercise lists', async () => {
      const workout = await workouts.createWorkout({
        name: 'Push Day',
        description: 'Chest and triceps',
      });

      expect(workout.exercises).toEqual([]);

      const withExercises = await workouts.setExercises(workout.id, [
        {
          id: 'we-1',
          exerciseId: 'ex-1',
          order: 1,
          sets: [
            {
              id: 'st-1',
              setNumber: 1,
              setType: SetType.NORMAL,
              targetMetrics: [{ metric: TrackingMetric.REPS, value: 8 }],
            },
          ],
          restSeconds: 90,
        },
      ]);

      expect(withExercises.exercises).toHaveLength(1);
      expect(withExercises.exercises[0].exerciseId).toBe('ex-1');

      const found = await workouts.searchByName('push');
      expect(found).toHaveLength(1);
    });
  });

  describe('WorkoutProgramRepository', () => {
    it('ensures only one active program at a time', async () => {
      const first = await programs.createProgram({
        name: 'PPL',
        isActive: true,
      });
      const second = await programs.createProgram({
        name: 'Upper/Lower',
        isActive: true,
      });

      const reloadedFirst = await programs.getById(first.id);
      const active = await programs.getActiveProgram();

      expect(reloadedFirst?.isActive).toBe(false);
      expect(active?.id).toBe(second.id);
    });

    it('updates schedule for a program', async () => {
      const program = await programs.createProgram({ name: 'Full Body' });
      const updated = await programs.setSchedule(program.id, [
        {
          id: 'sch-1',
          dayOfWeek: DayOfWeek.MONDAY,
          workoutId: 'w-1',
          isRestDay: false,
        },
      ]);

      expect(updated.schedule).toHaveLength(1);
      expect(updated.schedule[0].workoutId).toBe('w-1');
    });
  });

  describe('WorkoutSessionRepository', () => {
    it('tracks active, paused, completed, and abandoned sessions', async () => {
      const session = await sessions.createSession({
        workoutId: 'workout-1',
        programId: 'program-1',
      });

      expect(session.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
      expect((await sessions.getActiveSession())?.id).toBe(session.id);

      await sessions.pauseSession(session.id);
      expect((await sessions.getActiveSession())?.status).toBe(WorkoutSessionStatus.PAUSED);

      await sessions.resumeSession(session.id);
      expect((await sessions.getActiveSession())?.status).toBe(
        WorkoutSessionStatus.IN_PROGRESS,
      );

      const completed = await sessions.completeSession(session.id, 'Felt strong');
      expect(completed.status).toBe(WorkoutSessionStatus.COMPLETED);
      expect(completed.completedAt).toBeInstanceOf(Date);
      expect(completed.notes).toBe('Felt strong');
      expect(await sessions.getActiveSession()).toBeUndefined();

      const history = await sessions.getCompletedSessions();
      expect(history).toHaveLength(1);

      const abandoned = await sessions.createSession({ workoutId: 'workout-2' });
      await sessions.abandonSession(abandoned.id);
      expect((await sessions.getById(abandoned.id))?.status).toBe(
        WorkoutSessionStatus.ABANDONED,
      );
    });

    it('queries sessions by workout id', async () => {
      await sessions.createSession({ workoutId: 'w-a' });
      await sessions.createSession({ workoutId: 'w-a' });
      await sessions.createSession({ workoutId: 'w-b' });

      const forA = await sessions.getByWorkoutId('w-a');
      expect(forA).toHaveLength(2);
    });
  });

  describe('Repository base operations', () => {
    it('supports delete, upsert, exists, and clear', async () => {
      const user = await users.createUser({ name: 'Temp' });
      expect(await users.exists(user.id)).toBe(true);

      await users.upsert({ ...user, name: 'Upserted' });
      expect((await users.getById(user.id))?.name).toBe('Upserted');

      await users.delete(user.id);
      expect(await users.exists(user.id)).toBe(false);

      await users.createUser({ name: 'A' });
      await users.createUser({ name: 'B' });
      await users.clear();
      expect(await users.count()).toBe(0);
    });
  });
});
