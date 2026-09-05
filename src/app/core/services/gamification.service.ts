import { Injectable, inject, signal } from '@angular/core';
import type { WorkoutSession } from '../models';
import { WorkoutSessionRepository } from '../storage';
import {
  buildGamificationSnapshot,
  buildSessionCelebration,
  type GamificationSnapshot,
  type NewPersonalRecord,
  type SessionCelebration,
} from '../utils';
import { ExerciseService } from './exercise.service';

export type NamedPersonalRecord = NewPersonalRecord & { name: string };

export type CelebrationView = Omit<SessionCelebration, 'newPersonalRecords'> & {
  newPersonalRecords: NamedPersonalRecord[];
};

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly sessions = inject(WorkoutSessionRepository);
  private readonly exercises = inject(ExerciseService);

  private readonly snapshotSignal = signal<GamificationSnapshot | null>(null);
  private readonly loaded = signal(false);

  readonly snapshot = this.snapshotSignal.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();

  async load(): Promise<GamificationSnapshot> {
    const completed = await this.sessions.getCompletedSessions();
    const snapshot = buildGamificationSnapshot(completed);
    this.snapshotSignal.set(snapshot);
    this.loaded.set(true);
    return snapshot;
  }

  async celebrateSession(session: WorkoutSession): Promise<CelebrationView> {
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const completed = await this.sessions.getCompletedSessions();
    const prior = completed.filter((item) => item.id !== session.id);
    const celebration = buildSessionCelebration(session, prior);

    this.snapshotSignal.set(buildGamificationSnapshot([...prior, session]));
    this.loaded.set(true);

    const nameOf = (id: string) =>
      this.exercises.exercises().find((exercise) => exercise.id === id)?.name ?? 'Exercise';

    return {
      ...celebration,
      newPersonalRecords: celebration.newPersonalRecords.map((record) => ({
        ...record,
        name: nameOf(record.exerciseId),
      })),
    };
  }
}
