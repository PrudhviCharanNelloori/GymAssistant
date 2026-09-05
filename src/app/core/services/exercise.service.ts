import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Equipment,
  MuscleGroup,
  TrackingMetric,
  type Exercise,
} from '../models';
import {
  ExerciseRepository,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from '../storage';

export type ExerciseFilters = {
  query: string;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
  customOnly: boolean | null;
};

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly repo = inject(ExerciseRepository);

  private readonly allExercises = signal<Exercise[]>([]);
  private readonly loaded = signal(false);

  readonly searchQuery = signal('');
  readonly muscleFilter = signal<MuscleGroup | null>(null);
  readonly equipmentFilter = signal<Equipment | null>(null);
  readonly customOnlyFilter = signal<boolean | null>(null);

  readonly exercises = this.allExercises.asReadonly();
  readonly isLoaded = this.loaded.asReadonly();

  readonly filteredExercises = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const muscle = this.muscleFilter();
    const equipment = this.equipmentFilter();
    const customOnly = this.customOnlyFilter();

    return this.allExercises()
      .filter((exercise) => {
        if (query && !exercise.name.toLowerCase().includes(query)) {
          return false;
        }
        if (muscle && exercise.primaryMuscleGroup !== muscle) {
          return false;
        }
        if (equipment && !exercise.equipment.includes(equipment)) {
          return false;
        }
        if (customOnly === true && !exercise.isCustom) {
          return false;
        }
        if (customOnly === false && exercise.isCustom) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly exerciseCount = computed(() => this.allExercises().length);
  readonly filteredCount = computed(() => this.filteredExercises().length);

  async load(): Promise<void> {
    const exercises = await this.repo.getAll();
    this.allExercises.set(exercises);
    this.loaded.set(true);
  }

  async getById(id: string): Promise<Exercise | undefined> {
    const cached = this.allExercises().find((exercise) => exercise.id === id);
    if (cached) {
      return cached;
    }
    return this.repo.getById(id);
  }

  async createCustom(
    input: Omit<CreateExerciseInput, 'isCustom' | 'trackingMetrics'> & {
      trackingMetrics?: TrackingMetric[];
    },
  ): Promise<Exercise> {
    const exercise = await this.repo.createExercise({
      ...input,
      trackingMetrics:
        input.trackingMetrics?.length
          ? input.trackingMetrics
          : [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: true,
    });

    this.allExercises.update((list) => [...list, exercise]);
    return exercise;
  }

  async updateExercise(id: string, changes: UpdateExerciseInput): Promise<Exercise> {
    const updated = await this.repo.updateExercise(id, changes);
    this.allExercises.update((list) =>
      list.map((exercise) => (exercise.id === id ? updated : exercise)),
    );
    return updated;
  }

  async deleteCustom(id: string): Promise<void> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Exercise not found: ${id}`);
    }
    if (!existing.isCustom) {
      throw new Error('Built-in exercises cannot be deleted');
    }

    await this.repo.delete(id);
    this.allExercises.update((list) => list.filter((exercise) => exercise.id !== id));
  }

  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  setMuscleFilter(muscle: MuscleGroup | null): void {
    this.muscleFilter.set(muscle);
  }

  toggleMuscleFilter(muscle: MuscleGroup): void {
    this.muscleFilter.update((current) => (current === muscle ? null : muscle));
  }

  toggleEquipmentFilter(equipment: Equipment): void {
    this.equipmentFilter.update((current) => (current === equipment ? null : equipment));
  }

  toggleCustomOnly(): void {
    this.customOnlyFilter.update((current) => (current === true ? null : true));
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.muscleFilter.set(null);
    this.equipmentFilter.set(null);
    this.customOnlyFilter.set(null);
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery().trim().length > 0 ||
      this.muscleFilter() !== null ||
      this.equipmentFilter() !== null ||
      this.customOnlyFilter() !== null
    );
  }
}
