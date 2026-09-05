import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Exercise, Workout, WorkoutExercise } from '../../../core/models';
import { ExerciseService, WorkoutService } from '../../../core/services';
import { summarizeWorkoutExercise } from '../../../core/utils';

@Component({
  selector: 'app-workout-editor',
  imports: [RouterLink, DragDropModule],
  templateUrl: './workout-editor.component.html',
  styleUrl: './workout-editor.component.scss',
})
export class WorkoutEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);
  private readonly exerciseService = inject(ExerciseService);

  readonly workoutId = signal<string | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly exercises = signal<WorkoutExercise[]>([]);
  readonly exerciseMap = signal<Record<string, Exercise>>({});
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly rearranging = signal(false);

  readonly stats = computed(() =>
    this.workoutService.summary({
      id: 'draft',
      name: this.name(),
      exercises: this.exercises(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );

  async ngOnInit(): Promise<void> {
    await this.exerciseService.load();

    if (this.isCreateRoute()) {
      try {
        if (!this.workoutService.isLoaded()) {
          await this.workoutService.load();
        }
        const created = await this.workoutService.createWorkout({ name: 'New Workout' });
        this.hydrate(created);
        this.loading.set(false);
        await this.router.navigate(['/workouts', created.id], { replaceUrl: true });
      } catch {
        this.error.set('Could not create workout');
        this.loading.set(false);
      }
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Workout not found');
      this.loading.set(false);
      return;
    }

    if (!this.workoutService.isLoaded()) {
      await this.workoutService.load();
    }

    const workout = await this.workoutService.getById(id);
    if (!workout) {
      this.error.set('Workout not found');
      this.loading.set(false);
      return;
    }

    this.hydrate(workout);
    this.loading.set(false);
  }

  private isCreateRoute(): boolean {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    return path === 'workouts/new' || path === 'new';
  }

  private hydrate(workout: Workout): void {
    this.workoutId.set(workout.id);
    this.name.set(workout.name);
    this.description.set(workout.description ?? '');
    this.exercises.set([...workout.exercises].sort((a, b) => a.order - b.order));
    void this.resolveExerciseNames(workout.exercises);
  }

  private async resolveExerciseNames(items: WorkoutExercise[]): Promise<void> {
    const map: Record<string, Exercise> = {};
    for (const item of items) {
      const exercise = await this.exerciseService.getById(item.exerciseId);
      if (exercise) {
        map[item.exerciseId] = exercise;
      }
    }
    this.exerciseMap.set(map);
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseMap()[exerciseId]?.name ?? 'Exercise';
  }

  exerciseMeta(item: WorkoutExercise): string {
    return summarizeWorkoutExercise(item);
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  toggleRearrange(): void {
    this.rearranging.update((value) => !value);
  }

  dropExercise(event: CdkDragDrop<WorkoutExercise[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    this.exercises.update((list) => {
      const next = [...list];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next.map((item, order) => ({ ...item, order }));
    });
  }

  removeExercise(id: string): void {
    const name = this.exerciseName(
      this.exercises().find((item) => item.id === id)?.exerciseId ?? '',
    );
    const confirmed = window.confirm(`Remove “${name || 'this exercise'}” from the workout?`);
    if (!confirmed) return;

    this.exercises.update((list) =>
      list.filter((item) => item.id !== id).map((item, order) => ({ ...item, order })),
    );
  }

  async save(): Promise<void> {
    const name = this.name().trim();
    const id = this.workoutId();
    if (!name || !id || this.saving()) {
      this.error.set('Name is required');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const updated = await this.workoutService.updateWorkout(id, {
        name,
        description: this.description().trim() || undefined,
        exercises: this.exercises().map((item, order) => ({ ...item, order })),
      });
      this.hydrate(updated);
      this.rearranging.set(false);
    } catch {
      this.error.set('Could not save workout');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteWorkout(): Promise<void> {
    const id = this.workoutId();
    if (!id) return;

    const confirmed = window.confirm('Delete this workout?');
    if (!confirmed) return;

    await this.workoutService.deleteWorkout(id);
    await this.router.navigate(['/workouts']);
  }
}
