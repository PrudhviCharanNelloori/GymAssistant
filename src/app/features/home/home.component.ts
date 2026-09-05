import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Workout } from '../../core/models';
import {
  ActiveWorkoutService,
  ProgressService,
  WorkoutProgramService,
  WorkoutService,
} from '../../core/services';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly programService = inject(WorkoutProgramService);
  private readonly workoutService = inject(WorkoutService);
  private readonly activeWorkout = inject(ActiveWorkoutService);
  private readonly progressService = inject(ProgressService);

  readonly today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  readonly todaysWorkout = signal<Workout | null>(null);
  readonly hasActiveSession = signal(false);
  readonly isPaused = signal(false);
  readonly loading = signal(true);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);
  readonly streak = signal(0);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.programService.load(),
      this.activeWorkout.hydrate(),
      this.progressService.load(),
    ]);
    const workout = await this.programService.getTodaysWorkout();
    this.todaysWorkout.set(workout ?? null);
    this.hasActiveSession.set(this.activeWorkout.hasActiveSession());
    this.isPaused.set(this.activeWorkout.isPaused());
    this.streak.set(this.progressService.overview()?.streaks.current ?? 0);
    this.loading.set(false);
  }

  summary(workout: Workout) {
    return this.workoutService.summary(workout);
  }

  async startOrResume(): Promise<void> {
    if (this.starting()) return;
    this.starting.set(true);
    this.error.set(null);

    try {
      if (this.hasActiveSession()) {
        if (this.isPaused()) {
          await this.activeWorkout.resume();
        }
        await this.router.navigate(['/session/active']);
        return;
      }

      await this.activeWorkout.startTodaysWorkout();
      await this.router.navigate(['/session/active']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not start workout');
    } finally {
      this.starting.set(false);
    }
  }
}
