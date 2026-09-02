import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  User,
  Workout,
  WorkoutProgram,
  WorkoutSession,
} from '../models';

export const DB_NAME = 'GymAssistantDB';
export const DB_VERSION = 1;

export const TABLE_NAMES = {
  users: 'users',
  exercises: 'exercises',
  workoutPrograms: 'workoutPrograms',
  workouts: 'workouts',
  workoutSessions: 'workoutSessions',
} as const;

/**
 * IndexedDB schema stub. CRUD services will be implemented in Phase 2.
 */
export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  exercises!: Table<Exercise, string>;
  workoutPrograms!: Table<WorkoutProgram, string>;
  workouts!: Table<Workout, string>;
  workoutSessions!: Table<WorkoutSession, string>;

  constructor() {
    super(DB_NAME);

    this.version(DB_VERSION).stores({
      [TABLE_NAMES.users]: 'id',
      [TABLE_NAMES.exercises]: 'id, name, primaryMuscleGroup, isCustom',
      [TABLE_NAMES.workoutPrograms]: 'id, isActive',
      [TABLE_NAMES.workouts]: 'id, name',
      [TABLE_NAMES.workoutSessions]: 'id, workoutId, status, startedAt',
    });
  }
}

export const db = new AppDatabase();
