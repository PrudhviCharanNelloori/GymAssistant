import { Injectable, computed, inject, signal } from '@angular/core';
import {
  type DayOfWeek,
  type WeeklySchedule,
  type Workout,
  type WorkoutProgram,
} from '../models';
import { WorkoutProgramRepository } from '../storage';
import {
  createEmptyWeekSchedule,
  dayOfWeekFromDate,
  normalizeSchedule,
} from '../utils';
import { WorkoutService } from './workout.service';

@Injectable({ providedIn: 'root' })
export class WorkoutProgramService {
  private readonly repo = inject(WorkoutProgramRepository);
  private readonly workouts = inject(WorkoutService);

  private readonly activeProgram = signal<WorkoutProgram | null>(null);
  private readonly loaded = signal(false);

  readonly program = this.activeProgram.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();

  readonly schedule = computed(() => {
    const program = this.activeProgram();
    return program ? normalizeSchedule(program.schedule) : [];
  });

  async load(): Promise<WorkoutProgram> {
    if (!this.workouts.isLoaded()) {
      await this.workouts.load();
    }

    const program = await this.ensureActiveProgram();
    this.activeProgram.set(program);
    this.loaded.set(true);
    return program;
  }

  async ensureActiveProgram(): Promise<WorkoutProgram> {
    const existing = await this.repo.getActiveProgram();
    if (existing) {
      const normalized = normalizeSchedule(existing.schedule);
      if (normalized.length !== existing.schedule.length) {
        return this.repo.updateProgram(existing.id, { schedule: normalized });
      }
      return existing;
    }

    return this.repo.createProgram({
      name: 'My Program',
      description: 'Weekly training split',
      isActive: true,
      schedule: createEmptyWeekSchedule(),
    });
  }

  async rename(name: string): Promise<WorkoutProgram> {
    const current = this.activeProgram();
    if (!current) {
      throw new Error('No active program');
    }

    const updated = await this.repo.updateProgram(current.id, { name: name.trim() || current.name });
    this.activeProgram.set(updated);
    return updated;
  }

  async assignDay(day: DayOfWeek, workoutId: string | null, restDay = false): Promise<WorkoutProgram> {
    const current = this.activeProgram();
    if (!current) {
      throw new Error('No active program');
    }

    const schedule = normalizeSchedule(current.schedule).map((entry) => {
      if (entry.dayOfWeek !== day) {
        return entry;
      }

      if (restDay || !workoutId) {
        return {
          ...entry,
          workoutId: undefined,
          isRestDay: restDay || !workoutId,
        };
      }

      return {
        ...entry,
        workoutId,
        isRestDay: false,
      };
    });

    const updated = await this.repo.setSchedule(current.id, schedule);
    this.activeProgram.set(updated);
    return updated;
  }

  async getTodaysWorkout(date: Date = new Date()): Promise<Workout | undefined> {
    if (!this.loaded()) {
      await this.load();
    }

    const day = dayOfWeekFromDate(date);
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    if (!entry || entry.isRestDay || !entry.workoutId) {
      return undefined;
    }

    return this.workouts.getById(entry.workoutId);
  }

  workoutName(workoutId: string | undefined): string {
    if (!workoutId) {
      return 'Rest';
    }
    return this.workouts.workouts().find((workout) => workout.id === workoutId)?.name ?? 'Workout';
  }

  entryFor(day: DayOfWeek): WeeklySchedule | undefined {
    return this.schedule().find((entry) => entry.dayOfWeek === day);
  }
}
