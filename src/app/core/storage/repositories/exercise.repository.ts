import { Injectable } from '@angular/core';
import type { Equipment, Exercise, MuscleGroup } from '../../models';
import { createId } from '../../utils';
import { AppDatabase } from '../database';
import { BaseRepository } from './base.repository';

export type CreateExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'isCustom'> & {
  id?: string;
  isCustom?: boolean;
};

export type UpdateExerciseInput = Partial<
  Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
>;

@Injectable({ providedIn: 'root' })
export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor(db: AppDatabase) {
    super(db.exercises);
  }

  async createExercise(input: CreateExerciseInput): Promise<Exercise> {
    const now = new Date();
    return this.create({
      ...input,
      id: input.id ?? createId(),
      secondaryMuscleGroups: input.secondaryMuscleGroups ?? [],
      equipment: input.equipment ?? [],
      trackingMetrics: input.trackingMetrics ?? [],
      isCustom: input.isCustom ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateExercise(id: string, changes: UpdateExerciseInput): Promise<Exercise> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Exercise not found: ${id}`);
    }

    return this.update({
      ...existing,
      ...changes,
      updatedAt: new Date(),
    });
  }

  async searchByName(query: string): Promise<Exercise[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return this.getAll();
    }

    return this.table
      .filter((exercise) => exercise.name.toLowerCase().includes(normalized))
      .toArray();
  }

  async getByPrimaryMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    return this.table.where('primaryMuscleGroup').equals(muscleGroup).toArray();
  }

  async getCustomExercises(): Promise<Exercise[]> {
    return this.table.filter((exercise) => exercise.isCustom).toArray();
  }

  async getBuiltInExercises(): Promise<Exercise[]> {
    return this.table.filter((exercise) => !exercise.isCustom).toArray();
  }

  async filter(options: {
    muscleGroup?: MuscleGroup;
    equipment?: Equipment;
    customOnly?: boolean;
  }): Promise<Exercise[]> {
    let results = await this.getAll();

    if (options.muscleGroup !== undefined) {
      results = results.filter((e) => e.primaryMuscleGroup === options.muscleGroup);
    }

    if (options.equipment !== undefined) {
      results = results.filter((e) => e.equipment.includes(options.equipment!));
    }

    if (options.customOnly === true) {
      results = results.filter((e) => e.isCustom);
    } else if (options.customOnly === false) {
      results = results.filter((e) => !e.isCustom);
    }

    return results;
  }

  async bulkCreate(exercises: CreateExerciseInput[]): Promise<Exercise[]> {
    const now = new Date();
    const entities: Exercise[] = exercises.map((input) => ({
      ...input,
      id: input.id ?? createId(),
      secondaryMuscleGroups: input.secondaryMuscleGroups ?? [],
      equipment: input.equipment ?? [],
      trackingMetrics: input.trackingMetrics ?? [],
      isCustom: input.isCustom ?? true,
      createdAt: now,
      updatedAt: now,
    }));

    await this.table.bulkAdd(entities);
    return entities;
  }
}
