import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  SyncState,
  User,
  Workout,
  WorkoutProgram,
  WorkoutSession,
} from '../models';

export const DB_NAME = 'GymAssistantDB';
export const DB_VERSION = 2;

export const TABLE_NAMES = {
  users: 'users',
  exercises: 'exercises',
  workoutPrograms: 'workoutPrograms',
  workouts: 'workouts',
  workoutSessions: 'workoutSessions',
  syncState: 'syncState',
} as const;

/**
 * IndexedDB schema via Dexie. Provided as a root singleton for repositories.
 */
@Injectable({ providedIn: 'root' })
export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  exercises!: Table<Exercise, string>;
  workoutPrograms!: Table<WorkoutProgram, string>;
  workouts!: Table<Workout, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  syncState!: Table<SyncState, string>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      [TABLE_NAMES.users]: 'id',
      [TABLE_NAMES.exercises]: 'id, name, primaryMuscleGroup, isCustom',
      [TABLE_NAMES.workoutPrograms]: 'id, isActive',
      [TABLE_NAMES.workouts]: 'id, name',
      [TABLE_NAMES.workoutSessions]: 'id, workoutId, status, startedAt',
    });

    this.version(DB_VERSION).stores({
      [TABLE_NAMES.users]: 'id, userId, dirty',
      [TABLE_NAMES.exercises]: 'id, name, primaryMuscleGroup, isCustom, userId, dirty, updatedAt',
      [TABLE_NAMES.workoutPrograms]: 'id, isActive, userId, dirty, updatedAt',
      [TABLE_NAMES.workouts]: 'id, name, userId, dirty, updatedAt',
      [TABLE_NAMES.workoutSessions]: 'id, workoutId, status, startedAt, userId, dirty, updatedAt',
      [TABLE_NAMES.syncState]: 'id',
    });
  }
}
