import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MuscleGroup } from '../../../core/models';
import { ExerciseService, WorkoutService } from '../../../core/services';
import { createWorkoutExercise } from '../../../core/utils';

@Component({
  selector: 'app-workout-exercise-picker',
  templateUrl: './workout-exercise-picker.component.html',
  styleUrl: './workout-exercise-picker.component.scss',
})
export class WorkoutExercisePickerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly exerciseService = inject(ExerciseService);
  private readonly workoutService = inject(WorkoutService);

  readonly workoutId = signal('');
  readonly searchQuery = this.exerciseService.searchQuery;
  readonly exercises = this.exerciseService.filteredExercises;
  readonly muscleFilter = this.exerciseService.muscleFilter;
  readonly muscleGroups = Object.values(MuscleGroup);
  readonly loading = signal(true);
  readonly addingId = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly muscleShort: Record<MuscleGroup, string> = {
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

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/workouts']);
      return;
    }

    this.workoutId.set(id);
    this.exerciseService.clearFilters();
    await Promise.all([this.exerciseService.load(), this.workoutService.load()]);

    const workout = await this.workoutService.getById(id);
    if (!workout) {
      await this.router.navigate(['/workouts']);
      return;
    }

    this.selectedIds.set(new Set(workout.exercises.map((item) => item.exerciseId)));
    this.loading.set(false);
  }

  onSearch(event: Event): void {
    this.exerciseService.setSearch((event.target as HTMLInputElement).value);
  }

  selectMuscle(muscle: MuscleGroup | null): void {
    if (muscle === null) {
      this.exerciseService.setMuscleFilter(null);
      return;
    }
    this.exerciseService.toggleMuscleFilter(muscle);
  }

  isSelected(exerciseId: string): boolean {
    return this.selectedIds().has(exerciseId);
  }

  async addExercise(exerciseId: string): Promise<void> {
    if (this.addingId() || this.isSelected(exerciseId)) {
      return;
    }

    const workoutId = this.workoutId();
    const workout = await this.workoutService.getById(workoutId);
    const exercise = await this.exerciseService.getById(exerciseId);
    if (!workout || !exercise) {
      return;
    }

    this.addingId.set(exerciseId);
    try {
      const next = [
        ...workout.exercises,
        createWorkoutExercise(exercise, workout.exercises.length),
      ];
      await this.workoutService.setExercises(workoutId, next);
      this.selectedIds.update((set) => new Set([...set, exerciseId]));
    } finally {
      this.addingId.set(null);
    }
  }

  done(): void {
    void this.router.navigate(['/workouts', this.workoutId()]);
  }
}
