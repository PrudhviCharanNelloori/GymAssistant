import { Injectable, computed, inject, signal } from '@angular/core';
import type { Exercise, SetResult, WorkoutSession } from '../models';
import { TrackingMetric } from '../models';
import { WorkoutSessionRepository } from '../storage';
import {
  formatExerciseSessionSummary,
  formatSessionDate,
  formatSetResult,
  summarizeSession,
  type SessionStats,
} from '../utils';
import { ExerciseService } from './exercise.service';
import { WorkoutService } from './workout.service';

export type HistoryListItem = {
  session: WorkoutSession;
  workoutName: string;
  dateLabel: string;
  stats: SessionStats;
};

export type SessionDetailExercise = {
  exerciseId: string;
  name: string;
  order: number;
  summary: string;
  sets: Array<{
    setNumber: number;
    completed: boolean;
    label: string;
  }>;
};

export type SessionDetail = {
  session: WorkoutSession;
  workoutName: string;
  dateLabel: string;
  stats: SessionStats;
  exercises: SessionDetailExercise[];
};

export type ExerciseHistoryEntry = {
  sessionId: string;
  workoutName: string;
  dateLabel: string;
  completedAt: Date;
  summary: string;
  sets: SetResult[];
  bestSetLabel: string;
};

export type ExerciseHistory = {
  exercise: Exercise;
  entries: ExerciseHistoryEntry[];
  sessionCount: number;
  bestSetLabel: string;
};

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly sessions = inject(WorkoutSessionRepository);
  private readonly workouts = inject(WorkoutService);
  private readonly exercises = inject(ExerciseService);

  private readonly items = signal<HistoryListItem[]>([]);
  private readonly loaded = signal(false);

  readonly history = this.items.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();
  readonly count = computed(() => this.items().length);

  async load(): Promise<void> {
    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const completed = await this.sessions.getCompletedSessions();
    const list: HistoryListItem[] = completed.map((session) => ({
      session,
      workoutName: this.workoutName(session.workoutId),
      dateLabel: formatSessionDate(session),
      stats: summarizeSession(session),
    }));

    this.items.set(list);
    this.loaded.set(true);
  }

  async getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const session = await this.sessions.getById(sessionId);
    if (!session) {
      return null;
    }

    const exercises = [...session.exercises]
      .sort((a, b) => a.order - b.order)
      .map((exercise) => ({
        exerciseId: exercise.exerciseId,
        name: this.exerciseName(exercise.exerciseId),
        order: exercise.order,
        summary: formatExerciseSessionSummary(exercise),
        sets: exercise.sets.map((set) => ({
          setNumber: set.setNumber,
          completed: set.completed,
          label: set.completed ? formatSetResult(set) : 'Skipped',
        })),
      }));

    return {
      session,
      workoutName: this.workoutName(session.workoutId),
      dateLabel: formatSessionDate(session),
      stats: summarizeSession(session),
      exercises,
    };
  }

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistory | null> {
    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const exercise = await this.exercises.getById(exerciseId);
    if (!exercise) {
      return null;
    }

    const completed = await this.sessions.getCompletedSessions();
    const entries: ExerciseHistoryEntry[] = [];

    for (const session of completed) {
      const match = session.exercises.find((item) => item.exerciseId === exerciseId);
      if (!match) continue;

      const logged = match.sets.filter((set) => set.completed);
      if (logged.length === 0) continue;

      entries.push({
        sessionId: session.id,
        workoutName: this.workoutName(session.workoutId),
        dateLabel: formatSessionDate(session),
        completedAt: new Date(session.completedAt ?? session.startedAt),
        summary: formatExerciseSessionSummary(match),
        sets: logged,
        bestSetLabel: bestSetLabel(logged),
      });
    }

    entries.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    return {
      exercise,
      entries,
      sessionCount: entries.length,
      bestSetLabel: bestSetLabel(entries.flatMap((entry) => entry.sets)),
    };
  }

  private workoutName(workoutId: string): string {
    return this.workouts.workouts().find((workout) => workout.id === workoutId)?.name ?? 'Workout';
  }

  private exerciseName(exerciseId: string): string {
    return this.exercises.exercises().find((exercise) => exercise.id === exerciseId)?.name ?? 'Exercise';
  }
}

function bestSetLabel(sets: SetResult[]): string {
  if (sets.length === 0) {
    return '—';
  }

  let best = sets[0];
  let bestScore = setScore(best);

  for (const set of sets.slice(1)) {
    const score = setScore(set);
    if (score > bestScore) {
      best = set;
      bestScore = score;
    }
  }

  return formatSetResult(best);
}

function setScore(set: SetResult): number {
  const weight =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.WEIGHT)?.value ?? 0;
  const reps =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.REPS)?.value ?? 0;
  const duration =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.DURATION)?.value ?? 0;

  if (weight > 0 && reps > 0) {
    return weight * reps;
  }
  if (reps > 0) {
    return reps;
  }
  return duration;
}
