import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TrackingMetric, WorkoutSessionStatus } from '../../core/models';
import { ActiveWorkoutService, WorkoutService } from '../../core/services';

@Component({
  selector: 'app-workout-complete',
  imports: [RouterLink],
  templateUrl: './workout-complete.component.html',
  styleUrl: './workout-complete.component.scss',
})
export class WorkoutCompleteComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activeWorkout = inject(ActiveWorkoutService);
  private readonly workouts = inject(WorkoutService);

  readonly loading = signal(true);
  readonly workoutName = signal('Workout');
  readonly durationMinutes = signal(0);
  readonly completedSets = signal(0);
  readonly totalSets = signal(0);
  readonly volume = signal(0);

  readonly completionRate = computed(() => {
    const total = this.totalSets();
    if (!total) return 0;
    return Math.round((this.completedSets() / total) * 100);
  });

  async ngOnInit(): Promise<void> {
    // Use in-memory completed session (hydrate would clear COMPLETED sessions)
    const session = this.activeWorkout.activeSession();
    if (!session || session.status !== WorkoutSessionStatus.COMPLETED) {
      await this.router.navigate(['/home']);
      return;
    }

    const fromState = this.activeWorkout.activeWorkout();
    const workout = fromState ?? (await this.workouts.getById(session.workoutId));
    this.workoutName.set(workout?.name ?? 'Workout');

    const started = new Date(session.startedAt).getTime();
    const ended = new Date(session.completedAt ?? new Date()).getTime();
    this.durationMinutes.set(Math.max(1, Math.round((ended - started) / 60000)));

    let completed = 0;
    let total = 0;
    let volume = 0;

    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        total += 1;
        if (!set.completed) continue;
        completed += 1;
        const weight =
          set.actualMetrics.find((metric) => metric.metric === TrackingMetric.WEIGHT)?.value ?? 0;
        const reps =
          set.actualMetrics.find((metric) => metric.metric === TrackingMetric.REPS)?.value ?? 0;
        volume += weight * reps;
      }
    }

    this.completedSets.set(completed);
    this.totalSets.set(total);
    this.volume.set(Math.round(volume));
    this.loading.set(false);
  }

  finish(): void {
    this.activeWorkout.clearAfterComplete();
    void this.router.navigate(['/home']);
  }
}
