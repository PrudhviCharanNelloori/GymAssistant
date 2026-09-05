import { Injectable, computed, inject, signal } from '@angular/core';
import {
  TrackingMetric,
  WorkoutSessionStatus,
  type Exercise,
  type ExerciseSession,
  type MetricValue,
  type SetResult,
  type SetTarget,
  type Workout,
  type WorkoutExercise,
  type WorkoutSession,
} from '../models';
import { WorkoutSessionRepository } from '../storage';
import { createId } from '../utils';
import { ExerciseService } from './exercise.service';
import { RestTimerService } from './rest-timer.service';
import { WorkoutProgramService } from './workout-program.service';
import { WorkoutService } from './workout.service';

export type ActiveSetView = {
  exerciseIndex: number;
  setIndex: number;
  exerciseCount: number;
  setCount: number;
  exercise: Exercise | null;
  workoutExercise: WorkoutExercise | null;
  exerciseSession: ExerciseSession | null;
  setResult: SetResult | null;
  targetSet: SetTarget | null;
  previousSets: SetResult[];
  workoutName: string;
  isLastSetOfExercise: boolean;
  isLastExercise: boolean;
};

@Injectable({ providedIn: 'root' })
export class ActiveWorkoutService {
  private readonly sessions = inject(WorkoutSessionRepository);
  private readonly workouts = inject(WorkoutService);
  private readonly programs = inject(WorkoutProgramService);
  private readonly exercises = inject(ExerciseService);
  private readonly restTimer = inject(RestTimerService);

  private readonly session = signal<WorkoutSession | null>(null);
  private readonly workout = signal<Workout | null>(null);
  private readonly exerciseIndex = signal(0);
  private readonly setIndex = signal(0);
  private readonly draftMetrics = signal<MetricValue[]>([]);
  private readonly previousSets = signal<SetResult[]>([]);
  private readonly loaded = signal(false);

  readonly activeSession = this.session.asReadonly();
  readonly activeWorkout = this.workout.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();
  readonly currentExerciseIndex = this.exerciseIndex.asReadonly();
  readonly currentSetIndex = this.setIndex.asReadonly();
  readonly metrics = this.draftMetrics.asReadonly();
  readonly previousPerformance = this.previousSets.asReadonly();

  readonly hasActiveSession = computed(() => {
    const current = this.session();
    return (
      current?.status === WorkoutSessionStatus.IN_PROGRESS ||
      current?.status === WorkoutSessionStatus.PAUSED
    );
  });

  readonly isPaused = computed(
    () => this.session()?.status === WorkoutSessionStatus.PAUSED,
  );

  readonly view = computed<ActiveSetView | null>(() => {
    const session = this.session();
    const workout = this.workout();
    if (!session || !workout) {
      return null;
    }

    const exerciseIndex = this.exerciseIndex();
    const setIndex = this.setIndex();
    const workoutExercise = [...workout.exercises].sort((a, b) => a.order - b.order)[
      exerciseIndex
    ];
    const exerciseSession = [...session.exercises].sort((a, b) => a.order - b.order)[
      exerciseIndex
    ];
    const setResult = exerciseSession?.sets[setIndex] ?? null;
    const targetSet = workoutExercise?.sets[setIndex] ?? null;
    const exercise =
      this.exercises.exercises().find((item) => item.id === workoutExercise?.exerciseId) ??
      null;

    return {
      exerciseIndex,
      setIndex,
      exerciseCount: session.exercises.length,
      setCount: exerciseSession?.sets.length ?? 0,
      exercise,
      workoutExercise: workoutExercise ?? null,
      exerciseSession: exerciseSession ?? null,
      setResult,
      targetSet,
      previousSets: this.previousSets(),
      workoutName: workout.name,
      isLastSetOfExercise: setIndex >= (exerciseSession?.sets.length ?? 1) - 1,
      isLastExercise: exerciseIndex >= session.exercises.length - 1,
    };
  });

  async hydrate(): Promise<void> {
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }
    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }

    const active = await this.sessions.getActiveSession();
    if (!active) {
      this.clearLocal();
      this.loaded.set(true);
      return;
    }

    const workout = await this.workouts.getById(active.workoutId);
    this.session.set(active);
    this.workout.set(workout ?? null);
    this.restoreCursor(active);
    await this.refreshPreviousPerformance();
    this.syncDraftFromCurrentSet();
    this.loaded.set(true);
  }

  async startTodaysWorkout(): Promise<WorkoutSession> {
    await this.programs.load();
    const todays = await this.programs.getTodaysWorkout();
    if (!todays) {
      throw new Error('No workout scheduled for today');
    }
    if (todays.exercises.length === 0) {
      throw new Error('Today’s workout has no exercises');
    }

    return this.startWorkout(todays.id, this.programs.program()?.id);
  }

  async startWorkout(workoutId: string, programId?: string): Promise<WorkoutSession> {
    await this.hydrate();

    const existing = this.session();
    if (existing && this.hasActiveSession()) {
      return existing;
    }

    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }
    if (!this.exercises.isLoaded()) {
      await this.exercises.load();
    }

    const workout = await this.workouts.getById(workoutId);
    if (!workout) {
      throw new Error('Workout not found');
    }
    if (workout.exercises.length === 0) {
      throw new Error('Workout has no exercises');
    }

    const created = await this.sessions.createSession({
      workoutId: workout.id,
      programId,
      status: WorkoutSessionStatus.IN_PROGRESS,
      exercises: this.buildExerciseSessions(workout),
    });

    this.session.set(created);
    this.workout.set(workout);
    this.exerciseIndex.set(0);
    this.setIndex.set(0);
    await this.refreshPreviousPerformance();
    this.syncDraftFromCurrentSet();
    this.loaded.set(true);
    return created;
  }

  async resume(): Promise<void> {
    const current = this.session();
    if (!current) return;
    const updated = await this.sessions.resumeSession(current.id);
    this.session.set(updated);
  }

  async pause(): Promise<void> {
    const current = this.session();
    if (!current) return;
    this.restTimer.pause();
    const updated = await this.sessions.pauseSession(current.id);
    this.session.set(updated);
  }

  async abandon(): Promise<void> {
    const current = this.session();
    if (!current) return;
    this.restTimer.stop();
    await this.sessions.abandonSession(current.id);
    this.clearLocal();
  }

  setMetricValue(metric: MetricValue['metric'], value: number): void {
    this.draftMetrics.update((list) => {
      const exists = list.some((item) => item.metric === metric);
      if (!exists) {
        return [...list, { metric, value }];
      }
      return list.map((item) => (item.metric === metric ? { ...item, value } : item));
    });
  }

  adjustMetric(metric: MetricValue['metric'], delta: number, step = 1): void {
    const current = this.draftMetrics().find((item) => item.metric === metric)?.value ?? 0;
    const next = Math.max(0, roundMetric(current + delta * step, metric));
    this.setMetricValue(metric, next);
  }

  async completeSet(): Promise<'rest' | 'next-exercise' | 'completed'> {
    const current = this.requireSession();
    const view = this.view();
    if (!view?.exerciseSession || !view.setResult) {
      throw new Error('Nothing to complete');
    }

    const now = new Date();
    const exercises = current.exercises.map((exercise, index) => {
      if (index !== this.exerciseIndex()) {
        return exercise;
      }
      return {
        ...exercise,
        sets: exercise.sets.map((set, setIdx) => {
          if (setIdx !== this.setIndex()) {
            return set;
          }
          return {
            ...set,
            actualMetrics: this.draftMetrics().map((metric) => ({ ...metric })),
            completed: true,
            startedAt: set.startedAt ?? now,
            completedAt: now,
          };
        }),
      };
    });

    const updated = await this.sessions.setExercises(current.id, exercises);
    this.session.set(updated);

    if (!view.isLastSetOfExercise) {
      this.setIndex.update((value) => value + 1);
      this.syncDraftFromCurrentSet();
      const rest = view.workoutExercise?.restSeconds ?? 90;
      this.restTimer.start(rest);
      return 'rest';
    }

    if (!view.isLastExercise) {
      this.exerciseIndex.update((value) => value + 1);
      this.setIndex.set(0);
      await this.refreshPreviousPerformance();
      this.syncDraftFromCurrentSet();
      const rest = view.workoutExercise?.restSeconds ?? 90;
      this.restTimer.start(rest);
      return 'next-exercise';
    }

    this.restTimer.stop();
    const completed = await this.sessions.completeSession(current.id);
    this.session.set(completed);
    return 'completed';
  }

  async skipSet(): Promise<'next-set' | 'next-exercise' | 'completed'> {
    const view = this.view();
    if (!view) {
      throw new Error('No active set');
    }

    this.restTimer.stop();

    if (!view.isLastSetOfExercise) {
      this.setIndex.update((value) => value + 1);
      this.syncDraftFromCurrentSet();
      return 'next-set';
    }

    if (!view.isLastExercise) {
      this.exerciseIndex.update((value) => value + 1);
      this.setIndex.set(0);
      await this.refreshPreviousPerformance();
      this.syncDraftFromCurrentSet();
      return 'next-exercise';
    }

    const current = this.requireSession();
    const completed = await this.sessions.completeSession(current.id);
    this.session.set(completed);
    return 'completed';
  }

  async skipExercise(): Promise<'next-exercise' | 'completed'> {
    const view = this.view();
    if (!view) {
      throw new Error('No active exercise');
    }

    this.restTimer.stop();

    if (!view.isLastExercise) {
      this.exerciseIndex.update((value) => value + 1);
      this.setIndex.set(0);
      await this.refreshPreviousPerformance();
      this.syncDraftFromCurrentSet();
      return 'next-exercise';
    }

    const current = this.requireSession();
    const completed = await this.sessions.completeSession(current.id);
    this.session.set(completed);
    return 'completed';
  }

  dismissRest(): void {
    this.restTimer.skip();
  }

  clearAfterComplete(): void {
    this.restTimer.stop();
    this.clearLocal();
  }

  private buildExerciseSessions(workout: Workout): ExerciseSession[] {
    return [...workout.exercises]
      .sort((a, b) => a.order - b.order)
      .map((item, order) => ({
        id: createId(),
        exerciseId: item.exerciseId,
        workoutExerciseId: item.id,
        order,
        sets: item.sets.map((set) => ({
          id: createId(),
          setNumber: set.setNumber,
          setType: set.setType,
          actualMetrics: set.targetMetrics.map((metric) => ({ ...metric })),
          completed: false,
        })),
      }));
  }

  private restoreCursor(session: WorkoutSession): void {
    const exercises = [...session.exercises].sort((a, b) => a.order - b.order);
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex += 1) {
      const sets = exercises[exerciseIndex].sets;
      const setIndex = sets.findIndex((set) => !set.completed);
      if (setIndex >= 0) {
        this.exerciseIndex.set(exerciseIndex);
        this.setIndex.set(setIndex);
        return;
      }
    }

    this.exerciseIndex.set(Math.max(0, exercises.length - 1));
    this.setIndex.set(0);
  }

  private syncDraftFromCurrentSet(): void {
    const view = this.view();
    const fromResult = view?.setResult?.actualMetrics;
    const fromTarget = view?.targetSet?.targetMetrics;
    this.draftMetrics.set([...(fromResult ?? fromTarget ?? [])].map((metric) => ({ ...metric })));
  }

  private async refreshPreviousPerformance(): Promise<void> {
    const view = this.view();
    const exerciseId = view?.workoutExercise?.exerciseId;
    if (!exerciseId) {
      this.previousSets.set([]);
      return;
    }

    const completed = await this.sessions.getCompletedSessions();
    for (const session of completed) {
      if (session.id === this.session()?.id) {
        continue;
      }
      const match = session.exercises.find((item) => item.exerciseId === exerciseId);
      const done = match?.sets.filter((set) => set.completed) ?? [];
      if (done.length > 0) {
        this.previousSets.set(done);
        return;
      }
    }
    this.previousSets.set([]);
  }

  private requireSession(): WorkoutSession {
    const current = this.session();
    if (!current) {
      throw new Error('No active session');
    }
    return current;
  }

  private clearLocal(): void {
    this.session.set(null);
    this.workout.set(null);
    this.exerciseIndex.set(0);
    this.setIndex.set(0);
    this.draftMetrics.set([]);
    this.previousSets.set([]);
  }
}

function roundMetric(value: number, metric: MetricValue['metric']): number {
  if (
    metric === TrackingMetric.WEIGHT ||
    metric === TrackingMetric.ASSISTANCE_WEIGHT
  ) {
    return Math.round(value * 2) / 2;
  }
  return Math.round(value);
}
