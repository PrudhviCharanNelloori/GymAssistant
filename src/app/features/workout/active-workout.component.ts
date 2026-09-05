import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TrackingMetric } from '../../core/models';
import {
  ActiveWorkoutService,
  RestTimerService,
} from '../../core/services';
import { formatEnumLabel } from '../../core/utils';

@Component({
  selector: 'app-active-workout',
  templateUrl: './active-workout.component.html',
  styleUrl: './active-workout.component.scss',
})
export class ActiveWorkoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activeWorkout = inject(ActiveWorkoutService);
  readonly restTimer = inject(RestTimerService);

  readonly formatLabel = formatEnumLabel;
  readonly TrackingMetric = TrackingMetric;

  readonly view = this.activeWorkout.view;
  readonly metrics = this.activeWorkout.metrics;
  readonly isPaused = this.activeWorkout.isPaused;
  readonly previous = this.activeWorkout.previousPerformance;
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly progressLabel = computed(() => {
    const current = this.view();
    if (!current) return '';
    return `Exercise ${current.exerciseIndex + 1}/${current.exerciseCount} · Set ${current.setIndex + 1}/${current.setCount}`;
  });

  async ngOnInit(): Promise<void> {
    await this.activeWorkout.hydrate();
    if (!this.activeWorkout.hasActiveSession()) {
      await this.router.navigate(['/home']);
      return;
    }
    if (this.activeWorkout.isPaused()) {
      // keep paused until user resumes
    }
    this.loading.set(false);
  }

  metricValue(metric: TrackingMetric): number {
    return this.metrics().find((item) => item.metric === metric)?.value ?? 0;
  }

  targetValue(metric: TrackingMetric): number | null {
    const target = this.view()?.targetSet?.targetMetrics.find((item) => item.metric === metric);
    return target?.value ?? null;
  }

  previousLine(): string {
    const sets = this.previous();
    if (!sets.length) {
      return 'No previous data';
    }
    return sets
      .map((set) => {
        const weight = set.actualMetrics.find((m) => m.metric === TrackingMetric.WEIGHT)?.value;
        const reps = set.actualMetrics.find((m) => m.metric === TrackingMetric.REPS)?.value;
        if (weight !== undefined && reps !== undefined) {
          return `${weight}×${reps}`;
        }
        if (reps !== undefined) {
          return `${reps} reps`;
        }
        return `Set ${set.setNumber}`;
      })
      .join(' · ');
  }

  trackedMetrics(): TrackingMetric[] {
    const fromExercise = this.view()?.exercise?.trackingMetrics;
    if (fromExercise?.length) {
      return fromExercise;
    }
    return this.metrics().map((item) => item.metric);
  }

  stepFor(metric: TrackingMetric): number {
    if (metric === TrackingMetric.WEIGHT || metric === TrackingMetric.ASSISTANCE_WEIGHT) {
      return 2.5;
    }
    return 1;
  }

  onMetricInput(metric: TrackingMetric, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      this.activeWorkout.setMetricValue(metric, value);
    }
  }

  adjust(metric: TrackingMetric, delta: number): void {
    this.activeWorkout.adjustMetric(metric, delta, this.stepFor(metric));
  }

  async completeSet(): Promise<void> {
    if (this.busy() || this.isPaused()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const result = await this.activeWorkout.completeSet();
      if (result === 'completed') {
        await this.router.navigate(['/session/complete']);
      }
    } catch {
      this.error.set('Could not complete set');
    } finally {
      this.busy.set(false);
    }
  }

  async skipSet(): Promise<void> {
    if (this.busy() || this.isPaused()) return;
    this.busy.set(true);
    try {
      const result = await this.activeWorkout.skipSet();
      if (result === 'completed') {
        await this.router.navigate(['/session/complete']);
      }
    } finally {
      this.busy.set(false);
    }
  }

  async skipExercise(): Promise<void> {
    if (this.busy() || this.isPaused()) return;
    this.busy.set(true);
    try {
      const result = await this.activeWorkout.skipExercise();
      if (result === 'completed') {
        await this.router.navigate(['/session/complete']);
      }
    } finally {
      this.busy.set(false);
    }
  }

  async togglePause(): Promise<void> {
    if (this.isPaused()) {
      await this.activeWorkout.resume();
      return;
    }
    await this.activeWorkout.pause();
  }

  async abandon(): Promise<void> {
    const confirmed = window.confirm('Abandon this workout? Progress will be saved as abandoned.');
    if (!confirmed) return;
    await this.activeWorkout.abandon();
    await this.router.navigate(['/home']);
  }

  dismissRest(): void {
    this.activeWorkout.dismissRest();
  }
}
