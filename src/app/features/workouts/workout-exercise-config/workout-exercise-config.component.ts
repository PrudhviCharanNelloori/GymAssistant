import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  SetType,
  TrackingMetric,
  type Exercise,
  type SetTarget,
  type WorkoutExercise,
} from '../../../core/models';
import { ExerciseService, ToastService, WorkoutService } from '../../../core/services';
import {
  createDefaultSetTargets,
  createId,
  defaultMetricUnit,
  formatEnumLabel,
} from '../../../core/utils';

@Component({
  selector: 'app-workout-exercise-config',
  imports: [RouterLink],
  templateUrl: './workout-exercise-config.component.html',
  styleUrl: './workout-exercise-config.component.scss',
})
export class WorkoutExerciseConfigComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly toast = inject(ToastService);

  readonly formatLabel = formatEnumLabel;
  readonly setTypes = Object.values(SetType);

  readonly workoutId = signal('');
  readonly workoutExerciseId = signal('');
  readonly exercise = signal<Exercise | null>(null);
  readonly sets = signal<SetTarget[]>([]);
  readonly restSeconds = signal(90);
  readonly notes = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly title = computed(() => this.exercise()?.name ?? 'Exercise');

  async ngOnInit(): Promise<void> {
    const workoutId = this.route.snapshot.paramMap.get('id');
    const workoutExerciseId = this.route.snapshot.paramMap.get('exerciseId');
    if (!workoutId || !workoutExerciseId) {
      await this.router.navigate(['/workouts']);
      return;
    }

    this.workoutId.set(workoutId);
    this.workoutExerciseId.set(workoutExerciseId);

    await Promise.all([this.workoutService.load(), this.exerciseService.load()]);
    const workout = await this.workoutService.getById(workoutId);
    const item = workout?.exercises.find((entry) => entry.id === workoutExerciseId);
    if (!workout || !item) {
      this.error.set('Exercise not found in workout');
      this.loading.set(false);
      return;
    }

    const exercise = await this.exerciseService.getById(item.exerciseId);
    this.exercise.set(exercise ?? null);
    this.sets.set(item.sets.map((set) => ({ ...set, targetMetrics: [...set.targetMetrics] })));
    this.restSeconds.set(item.restSeconds ?? 90);
    this.notes.set(item.notes ?? '');
    this.loading.set(false);
  }

  metricValue(set: SetTarget, metric: TrackingMetric): number {
    return set.targetMetrics.find((item) => item.metric === metric)?.value ?? 0;
  }

  trackedMetrics(): TrackingMetric[] {
    const exercise = this.exercise();
    if (exercise?.trackingMetrics.length) {
      return exercise.trackingMetrics;
    }
    return [TrackingMetric.WEIGHT, TrackingMetric.REPS];
  }

  onRestInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.restSeconds.set(Number.isFinite(value) ? Math.max(0, value) : 0);
  }

  onNotesInput(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  onMetricInput(setId: string, metric: TrackingMetric, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.sets.update((list) =>
      list.map((set) => {
        if (set.id !== setId) return set;
        const exists = set.targetMetrics.some((item) => item.metric === metric);
        const targetMetrics = exists
          ? set.targetMetrics.map((item) =>
              item.metric === metric
                ? { ...item, value: Number.isFinite(value) ? value : 0 }
                : item,
            )
          : [
              ...set.targetMetrics,
              {
                metric,
                value: Number.isFinite(value) ? value : 0,
                unit: defaultMetricUnit(metric),
              },
            ];
        return { ...set, targetMetrics };
      }),
    );
  }

  onSetTypeChange(setId: string, event: Event): void {
    const setType = (event.target as HTMLSelectElement).value as SetType;
    this.sets.update((list) =>
      list.map((set) => (set.id === setId ? { ...set, setType } : set)),
    );
  }

  addSet(): void {
    const exercise = this.exercise();
    if (!exercise) return;
    const template = createDefaultSetTargets(exercise, 1)[0];
    this.sets.update((list) => [
      ...list,
      { ...template, id: createId(), setNumber: list.length + 1 },
    ]);
  }

  removeSet(setId: string): void {
    this.sets.update((list) =>
      list
        .filter((set) => set.id !== setId)
        .map((set, index) => ({ ...set, setNumber: index + 1 })),
    );
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.toast.showBusy('Saving…');

    try {
      const workout = await this.workoutService.getById(this.workoutId());
      if (!workout) throw new Error('Workout missing');

      const exercises: WorkoutExercise[] = workout.exercises.map((item) => {
        if (item.id !== this.workoutExerciseId()) return item;
        return {
          ...item,
          sets: this.sets(),
          restSeconds: this.restSeconds(),
          notes: this.notes().trim() || undefined,
        };
      });

      await this.workoutService.setExercises(this.workoutId(), exercises);
      this.toast.done('Exercise saved');
      await this.router.navigate(['/workouts', this.workoutId()]);
    } catch {
      this.error.set('Could not save changes');
      this.toast.show('Could not save changes');
      this.saving.set(false);
    }
  }
}
