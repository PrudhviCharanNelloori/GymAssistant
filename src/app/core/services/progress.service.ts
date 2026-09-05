import { Injectable, computed, inject, signal } from '@angular/core';
import type { Exercise } from '../models';
import { WorkoutSessionRepository } from '../storage';
import {
  computePersonalRecords,
  computeStreaks,
  computeVolumeSummary,
  exerciseProgression,
  last7DaysStatus,
  last7DaysVolume,
  sessionDayKey,
  type PersonalRecord,
  type ProgressionPoint,
  type StreakSummary,
  type VolumeSummary,
  type WeekDayStatus,
  type WeeklyVolumePoint,
} from '../utils';
import { ExerciseService } from './exercise.service';

export type ProgressPrItem = PersonalRecord & {
  exerciseName: string;
};

export type ProgressOverview = {
  streaks: StreakSummary;
  volume: VolumeSummary;
  weekDays: WeekDayStatus[];
  weeklyVolume: WeeklyVolumePoint[];
  completedDayKeys: string[];
  personalRecords: ProgressPrItem[];
  trackedExercises: Array<{ id: string; name: string; sessionCount: number }>;
};

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly sessions = inject(WorkoutSessionRepository);
  private readonly exercises = inject(ExerciseService);

  private readonly overviewSignal = signal<ProgressOverview | null>(null);
  private readonly loaded = signal(false);
  private readonly selectedExerciseId = signal<string | null>(null);

  readonly overview = this.overviewSignal.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();
  readonly selectedId = this.selectedExerciseId.asReadonly();

  readonly selectedProgression = computed((): ProgressionPoint[] => {
    const overview = this.overviewSignal();
    const id = this.selectedExerciseId();
    if (!overview || !id) {
      return [];
    }
    return this.progressionCache.get(id) ?? [];
  });

  readonly selectedExerciseName = computed(() => {
    const id = this.selectedExerciseId();
    if (!id) return null;
    return this.overviewSignal()?.trackedExercises.find((item) => item.id === id)?.name ?? null;
  });

  private progressionCache = new Map<string, ProgressionPoint[]>();

  async load(): Promise<ProgressOverview> {
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const completed = await this.sessions.getCompletedSessions();
    const nameOf = (id: string) =>
      this.exercises.exercises().find((exercise: Exercise) => exercise.id === id)?.name ?? 'Exercise';

    this.progressionCache = new Map();
    const sessionCounts = new Map<string, number>();

    for (const session of completed) {
      for (const exercise of session.exercises) {
        const hasLogged = exercise.sets.some((set) => set.completed);
        if (!hasLogged) continue;
        sessionCounts.set(
          exercise.exerciseId,
          (sessionCounts.get(exercise.exerciseId) ?? 0) + 1,
        );
      }
    }

    for (const exerciseId of sessionCounts.keys()) {
      this.progressionCache.set(exerciseId, exerciseProgression(completed, exerciseId));
    }

    const personalRecords = computePersonalRecords(completed).map((record) => ({
      ...record,
      exerciseName: nameOf(record.exerciseId),
    }));

    const trackedExercises = [...sessionCounts.entries()]
      .map(([id, sessionCount]) => ({
        id,
        name: nameOf(id),
        sessionCount,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name));

    const overview: ProgressOverview = {
      streaks: computeStreaks(completed),
      volume: computeVolumeSummary(completed),
      weekDays: last7DaysStatus(completed),
      weeklyVolume: last7DaysVolume(completed),
      completedDayKeys: [...new Set(completed.map((session) => sessionDayKey(session)))],
      personalRecords,
      trackedExercises,
    };

    this.overviewSignal.set(overview);
    this.loaded.set(true);

    const current = this.selectedExerciseId();
    if (!current || !trackedExercises.some((item) => item.id === current)) {
      this.selectedExerciseId.set(trackedExercises[0]?.id ?? null);
    }

    return overview;
  }

  selectExercise(exerciseId: string): void {
    this.selectedExerciseId.set(exerciseId);
  }
}
