import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Equipment, MuscleGroup, type Exercise } from '../../core/models';
import { ExerciseService } from '../../core/services';

type ExerciseGroup = {
  muscle: MuscleGroup;
  label: string;
  exercises: Exercise[];
};

const MUSCLE_SHORT: Record<MuscleGroup, string> = {
  [MuscleGroup.CHEST]: 'Chest',
  [MuscleGroup.BACK]: 'Back',
  [MuscleGroup.SHOULDERS]: 'Shoulders',
  [MuscleGroup.BICEPS]: 'Biceps',
  [MuscleGroup.TRICEPS]: 'Triceps',
  [MuscleGroup.FOREARMS]: 'Forearms',
  [MuscleGroup.CORE]: 'Core',
  [MuscleGroup.QUADS]: 'Quads',
  [MuscleGroup.HAMSTRINGS]: 'Hams',
  [MuscleGroup.GLUTES]: 'Glutes',
  [MuscleGroup.CALVES]: 'Calves',
  [MuscleGroup.FULL_BODY]: 'Full body',
  [MuscleGroup.CARDIO]: 'Cardio',
};

const EQUIPMENT_SHORT: Record<Equipment, string> = {
  [Equipment.BARBELL]: 'Barbell',
  [Equipment.DUMBBELL]: 'Dumbbell',
  [Equipment.CABLE]: 'Cable',
  [Equipment.MACHINE]: 'Machine',
  [Equipment.BODYWEIGHT]: 'Bodyweight',
  [Equipment.KETTLEBELL]: 'Kettlebell',
  [Equipment.BAND]: 'Band',
  [Equipment.OTHER]: 'Other',
};

@Component({
  selector: 'app-exercises',
  imports: [RouterLink],
  templateUrl: './exercises.component.html',
  styleUrl: './exercises.component.scss',
})
export class ExercisesComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);

  readonly muscleGroups = Object.values(MuscleGroup);
  readonly equipmentOptions = Object.values(Equipment);

  readonly exercises = this.exerciseService.filteredExercises;
  readonly searchQuery = this.exerciseService.searchQuery;
  readonly muscleFilter = this.exerciseService.muscleFilter;
  readonly equipmentFilter = this.exerciseService.equipmentFilter;
  readonly customOnlyFilter = this.exerciseService.customOnlyFilter;
  readonly filteredCount = this.exerciseService.filteredCount;
  readonly totalCount = this.exerciseService.exerciseCount;

  readonly loading = signal(true);
  readonly filtersOpen = signal(false);

  readonly groups = computed<ExerciseGroup[]>(() => {
    const list = this.exercises();
    const query = this.searchQuery().trim();

    if (query) {
      return [
        {
          muscle: MuscleGroup.FULL_BODY,
          label: 'Results',
          exercises: list,
        },
      ];
    }

    const byMuscle = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of list) {
      const current = byMuscle.get(exercise.primaryMuscleGroup) ?? [];
      current.push(exercise);
      byMuscle.set(exercise.primaryMuscleGroup, current);
    }

    return this.muscleGroups
      .filter((muscle) => byMuscle.has(muscle))
      .map((muscle) => ({
        muscle,
        label: MUSCLE_SHORT[muscle],
        exercises: byMuscle.get(muscle) ?? [],
      }));
  });

  readonly advancedFilterCount = computed(() => {
    let count = 0;
    if (this.equipmentFilter()) count += 1;
    if (this.customOnlyFilter() === true) count += 1;
    return count;
  });

  async ngOnInit(): Promise<void> {
    await this.exerciseService.load();
    this.loading.set(false);
  }

  muscleLabel(muscle: MuscleGroup): string {
    return MUSCLE_SHORT[muscle];
  }

  equipmentLabel(equipment: Equipment): string {
    return EQUIPMENT_SHORT[equipment];
  }

  monogram(exercise: Exercise): string {
    return exercise.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  metaLine(exercise: Exercise): string {
    const parts = [MUSCLE_SHORT[exercise.primaryMuscleGroup]];
    if (exercise.equipment[0]) {
      parts.push(EQUIPMENT_SHORT[exercise.equipment[0]]);
    }
    return parts.join(' · ');
  }

  onSearch(event: Event): void {
    this.exerciseService.setSearch((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.exerciseService.setSearch('');
  }

  selectMuscle(muscle: MuscleGroup | null): void {
    if (muscle === null) {
      this.exerciseService.setMuscleFilter(null);
      return;
    }
    this.exerciseService.toggleMuscleFilter(muscle);
  }

  toggleEquipment(equipment: Equipment): void {
    this.exerciseService.toggleEquipmentFilter(equipment);
  }

  toggleCustomOnly(): void {
    this.exerciseService.toggleCustomOnly();
  }

  toggleFiltersPanel(): void {
    this.filtersOpen.update((open) => !open);
  }

  clearFilters(): void {
    this.exerciseService.clearFilters();
    this.filtersOpen.set(false);
  }

  hasFilters(): boolean {
    return this.exerciseService.hasActiveFilters();
  }
}
