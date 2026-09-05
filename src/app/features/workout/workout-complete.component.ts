import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WorkoutSessionStatus } from '../../core/models';
import {
  ActiveWorkoutService,
  GamificationService,
  type CelebrationView,
  WorkoutService,
} from '../../core/services';
import { summarizeSession } from '../../core/utils';

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
  private readonly gamification = inject(GamificationService);

  readonly loading = signal(true);
  readonly workoutName = signal('Workout');
  readonly durationMinutes = signal(0);
  readonly completedSets = signal(0);
  readonly totalSets = signal(0);
  readonly volume = signal(0);
  readonly celebration = signal<CelebrationView | null>(null);

  readonly completionRate = computed(() => {
    const total = this.totalSets();
    if (!total) return 0;
    return Math.round((this.completedSets() / total) * 100);
  });

  async ngOnInit(): Promise<void> {
    const session = this.activeWorkout.activeSession();
    if (!session || session.status !== WorkoutSessionStatus.COMPLETED) {
      await this.router.navigate(['/home']);
      return;
    }

    const fromState = this.activeWorkout.activeWorkout();
    const workout = fromState ?? (await this.workouts.getById(session.workoutId));
    this.workoutName.set(workout?.name ?? 'Workout');

    const stats = summarizeSession(session);
    this.durationMinutes.set(stats.durationMinutes);
    this.completedSets.set(stats.completedSets);
    this.totalSets.set(stats.totalSets);
    this.volume.set(stats.volumeKg);

    const celebration = await this.gamification.celebrateSession(session);
    this.celebration.set(celebration);
    this.loading.set(false);
  }

  finish(): void {
    this.activeWorkout.clearAfterComplete();
    void this.router.navigate(['/home']);
  }
}
