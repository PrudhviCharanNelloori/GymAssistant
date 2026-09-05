import { Injectable } from '@angular/core';
import {
  WorkoutSessionStatus,
  type ExerciseSession,
  type WorkoutSession,
} from '../../models';
import { createId } from '../../utils';
import { AppDatabase } from '../database';
import { BaseRepository } from './base.repository';

export type CreateWorkoutSessionInput = {
  id?: string;
  workoutId: string;
  programId?: string;
  startedAt?: Date;
  status?: WorkoutSessionStatus;
  exercises?: ExerciseSession[];
  notes?: string;
};

export type UpdateWorkoutSessionInput = Partial<
  Omit<WorkoutSession, 'id' | 'workoutId'>
>;

@Injectable({ providedIn: 'root' })
export class WorkoutSessionRepository extends BaseRepository<WorkoutSession> {
  constructor(db: AppDatabase) {
    super(db.workoutSessions);
  }

  async createSession(input: CreateWorkoutSessionInput): Promise<WorkoutSession> {
    return this.create({
      id: input.id ?? createId(),
      workoutId: input.workoutId,
      programId: input.programId,
      startedAt: input.startedAt ?? new Date(),
      status: input.status ?? WorkoutSessionStatus.IN_PROGRESS,
      exercises: input.exercises ?? [],
      notes: input.notes,
    });
  }

  async updateSession(
    id: string,
    changes: UpdateWorkoutSessionInput,
  ): Promise<WorkoutSession> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Workout session not found: ${id}`);
    }

    return this.update({
      ...existing,
      ...changes,
    });
  }

  async getByWorkoutId(workoutId: string): Promise<WorkoutSession[]> {
    return this.table.where('workoutId').equals(workoutId).toArray();
  }

  async getByStatus(status: WorkoutSessionStatus): Promise<WorkoutSession[]> {
    return this.table.where('status').equals(status).toArray();
  }

  async getActiveSession(): Promise<WorkoutSession | undefined> {
    const inProgress = await this.table
      .where('status')
      .equals(WorkoutSessionStatus.IN_PROGRESS)
      .first();

    if (inProgress) {
      return inProgress;
    }

    return this.table.where('status').equals(WorkoutSessionStatus.PAUSED).first();
  }

  async getCompletedSessions(): Promise<WorkoutSession[]> {
    const sessions = await this.getByStatus(WorkoutSessionStatus.COMPLETED);
    return sessions.sort(
      (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );
  }

  async completeSession(id: string, notes?: string): Promise<WorkoutSession> {
    return this.updateSession(id, {
      status: WorkoutSessionStatus.COMPLETED,
      completedAt: new Date(),
      notes,
    });
  }

  async abandonSession(id: string): Promise<WorkoutSession> {
    return this.updateSession(id, {
      status: WorkoutSessionStatus.ABANDONED,
      completedAt: new Date(),
    });
  }

  async pauseSession(id: string): Promise<WorkoutSession> {
    return this.updateSession(id, {
      status: WorkoutSessionStatus.PAUSED,
    });
  }

  async resumeSession(id: string): Promise<WorkoutSession> {
    return this.updateSession(id, {
      status: WorkoutSessionStatus.IN_PROGRESS,
    });
  }

  async setExercises(id: string, exercises: ExerciseSession[]): Promise<WorkoutSession> {
    return this.updateSession(id, { exercises });
  }
}
