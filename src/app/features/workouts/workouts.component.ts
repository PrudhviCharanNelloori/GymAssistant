import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService, WorkoutProgramService } from '../../core/services';
import { DAY_ORDER, DAY_SHORT } from '../../core/utils';

@Component({
  selector: 'app-workouts',
  imports: [RouterLink],
  templateUrl: './workouts.component.html',
  styleUrl: './workouts.component.scss',
})
export class WorkoutsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly workoutService = inject(WorkoutService);
  private readonly programService = inject(WorkoutProgramService);

  readonly workouts = this.workoutService.sortedWorkouts;
  readonly program = this.programService.program;
  readonly schedule = this.programService.schedule;
  readonly days = DAY_ORDER;
  readonly dayShort = DAY_SHORT;

  readonly loading = signal(true);
  readonly creating = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.workoutService.load(), this.programService.load()]);
    this.loading.set(false);
  }

  async createWorkout(): Promise<void> {
    if (this.creating()) {
      return;
    }

    this.creating.set(true);
    try {
      const created = await this.workoutService.createWorkout({ name: 'New Workout' });
      await this.router.navigate(['/workouts', created.id]);
    } finally {
      this.creating.set(false);
    }
  }

  summary(workoutId: string) {
    const workout = this.workouts().find((item) => item.id === workoutId);
    return workout ? this.workoutService.summary(workout) : null;
  }

  dayLabel(day: (typeof DAY_ORDER)[number]): string {
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    if (!entry || entry.isRestDay || !entry.workoutId) {
      return 'Rest';
    }
    return this.programService.workoutName(entry.workoutId);
  }
}
