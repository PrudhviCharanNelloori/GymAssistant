import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Workout } from '../../core/models';
import { WorkoutProgramService, WorkoutService } from '../../core/services';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly programService = inject(WorkoutProgramService);
  private readonly workoutService = inject(WorkoutService);

  readonly today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  readonly todaysWorkout = signal<Workout | null>(null);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.programService.load();
    const workout = await this.programService.getTodaysWorkout();
    this.todaysWorkout.set(workout ?? null);
    this.loading.set(false);
  }

  summary(workout: Workout) {
    return this.workoutService.summary(workout);
  }
}
