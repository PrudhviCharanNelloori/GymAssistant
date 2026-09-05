import { Injectable } from '@angular/core';
import type { WeeklySchedule, WorkoutProgram } from '../../models';
import { createId } from '../../utils';
import { AppDatabase } from '../database';
import { BaseRepository } from './base.repository';

export type CreateWorkoutProgramInput = {
  id?: string;
  name: string;
  description?: string;
  schedule?: WeeklySchedule[];
  isActive?: boolean;
};

export type UpdateWorkoutProgramInput = Partial<
  Omit<WorkoutProgram, 'id' | 'createdAt' | 'updatedAt'>
>;

@Injectable({ providedIn: 'root' })
export class WorkoutProgramRepository extends BaseRepository<WorkoutProgram> {
  constructor(private readonly db: AppDatabase) {
    super(db.workoutPrograms);
  }

  async createProgram(input: CreateWorkoutProgramInput): Promise<WorkoutProgram> {
    const now = new Date();
    const program: WorkoutProgram = {
      id: input.id ?? createId(),
      name: input.name,
      description: input.description,
      schedule: input.schedule ?? [],
      isActive: input.isActive ?? false,
      createdAt: now,
      updatedAt: now,
    };

    if (program.isActive) {
      await this.db.transaction('rw', this.table, async () => {
        await this.deactivateAll();
        await this.create(program);
      });
      return program;
    }

    return this.create(program);
  }

  async updateProgram(id: string, changes: UpdateWorkoutProgramInput): Promise<WorkoutProgram> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Workout program not found: ${id}`);
    }

    const updated: WorkoutProgram = {
      ...existing,
      ...changes,
      updatedAt: new Date(),
    };

    if (changes.isActive === true) {
      await this.db.transaction('rw', this.table, async () => {
        await this.deactivateAll(id);
        await this.update(updated);
      });
      return updated;
    }

    return this.update(updated);
  }

  async getActiveProgram(): Promise<WorkoutProgram | undefined> {
    return this.table.filter((program) => program.isActive).first();
  }

  async setActive(id: string): Promise<WorkoutProgram> {
    return this.updateProgram(id, { isActive: true });
  }

  async setSchedule(id: string, schedule: WeeklySchedule[]): Promise<WorkoutProgram> {
    return this.updateProgram(id, { schedule });
  }

  private async deactivateAll(exceptId?: string): Promise<void> {
    const programs = await this.getAll();
    const now = new Date();

    for (const program of programs) {
      if (program.isActive && program.id !== exceptId) {
        await this.table.put({
          ...program,
          isActive: false,
          updatedAt: now,
        });
      }
    }
  }
}
