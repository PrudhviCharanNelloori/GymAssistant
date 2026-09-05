import { Injectable } from '@angular/core';
import type { Workout, WorkoutExercise } from '../../models';
import { createId } from '../../utils';
import { AppDatabase } from '../database';
import { BaseRepository } from './base.repository';

export type CreateWorkoutInput = {
  id?: string;
  name: string;
  description?: string;
  exercises?: WorkoutExercise[];
};

export type UpdateWorkoutInput = Partial<Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>>;

@Injectable({ providedIn: 'root' })
export class WorkoutRepository extends BaseRepository<Workout> {
  constructor(db: AppDatabase) {
    super(db.workouts);
  }

  async createWorkout(input: CreateWorkoutInput): Promise<Workout> {
    const now = new Date();
    return this.create({
      id: input.id ?? createId(),
      name: input.name,
      description: input.description,
      exercises: input.exercises ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateWorkout(id: string, changes: UpdateWorkoutInput): Promise<Workout> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Workout not found: ${id}`);
    }

    return this.update({
      ...existing,
      ...changes,
      updatedAt: new Date(),
    });
  }

  async searchByName(query: string): Promise<Workout[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.getAll();
    }

    return this.table
      .filter((workout) => workout.name.toLowerCase().includes(normalized))
      .toArray();
  }

  async setExercises(id: string, exercises: WorkoutExercise[]): Promise<Workout> {
    return this.updateWorkout(id, { exercises });
  }
}
