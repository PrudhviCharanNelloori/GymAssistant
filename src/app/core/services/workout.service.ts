import { Injectable, computed, inject, signal } from '@angular/core';
import type { Workout, WorkoutExercise } from '../models';
import { WorkoutRepository } from '../storage';
import { estimateWorkoutMinutes } from '../utils';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private readonly repo = inject(WorkoutRepository);
  private readonly sync = inject(SyncService);

  private readonly allWorkouts = signal<Workout[]>([]);
  private readonly loaded = signal(false);

  readonly workouts = this.allWorkouts.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();
  readonly workoutCount = computed(() => this.allWorkouts().length);

  readonly sortedWorkouts = computed(() =>
    [...this.allWorkouts()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  async load(): Promise<void> {
    const workouts = await this.repo.getAll();
    this.allWorkouts.set(workouts);
    this.loaded.set(true);
  }

  async getById(id: string): Promise<Workout | undefined> {
    const cached = this.allWorkouts().find((workout) => workout.id === id);
    if (cached) {
      return cached;
    }
    return this.repo.getById(id);
  }

  async createWorkout(input: {
    name: string;
    description?: string;
    exercises?: WorkoutExercise[];
  }): Promise<Workout> {
    const workout = await this.repo.createWorkout(input);
    this.allWorkouts.update((list) => [...list, workout]);
    this.sync.scheduleSync();
    return workout;
  }

  async updateWorkout(
    id: string,
    changes: Partial<Pick<Workout, 'name' | 'description' | 'exercises'>>,
  ): Promise<Workout> {
    const updated = await this.repo.updateWorkout(id, changes);
    this.allWorkouts.update((list) =>
      list.map((workout) => (workout.id === id ? updated : workout)),
    );
    this.sync.scheduleSync();
    return updated;
  }

  async deleteWorkout(id: string): Promise<void> {
    await this.repo.delete(id);
    this.allWorkouts.update((list) => list.filter((workout) => workout.id !== id));
    this.sync.scheduleSync();
  }

  async setExercises(id: string, exercises: WorkoutExercise[]): Promise<Workout> {
    return this.updateWorkout(id, { exercises });
  }

  summary(workout: Workout): { exerciseCount: number; setCount: number; minutes: number } {
    const setCount = workout.exercises.reduce((total, item) => total + item.sets.length, 0);
    return {
      exerciseCount: workout.exercises.length,
      setCount,
      minutes: estimateWorkoutMinutes(workout.exercises),
    };
  }
}
