import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { DayOfWeek, Workout } from '../../core/models';
import {
  ExerciseService,
  ToastService,
  WorkoutProgramService,
  WorkoutService,
} from '../../core/services';
import { DAY_ORDER, DAY_SHORT, dayOfWeekFromDate } from '../../core/utils';

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
  private readonly exerciseService = inject(ExerciseService);
  private readonly toast = inject(ToastService);

  readonly workouts = this.workoutService.sortedWorkouts;
  readonly program = this.programService.program;
  readonly schedule = this.programService.schedule;
  readonly days = DAY_ORDER;
  readonly dayShort = DAY_SHORT;
  readonly today = dayOfWeekFromDate();

  readonly loading = signal(true);
  readonly creating = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.workoutService.load(),
      this.programService.load(),
      this.exerciseService.load(),
    ]);
    this.loading.set(false);
  }

  async createWorkout(): Promise<void> {
    if (this.creating()) {
      return;
    }

    this.creating.set(true);
    this.toast.showBusy('Creating workout…');
    try {
      const created = await this.workoutService.createWorkout({ name: 'New Workout' });
      this.toast.clear();
      await this.router.navigate(['/workouts', created.id]);
    } catch {
      this.toast.show('Could not create workout');
    } finally {
      this.creating.set(false);
    }
  }

  summary(workoutId: string) {
    const workout = this.workouts().find((item) => item.id === workoutId);
    return workout ? this.workoutService.summary(workout) : null;
  }

  isToday(day: DayOfWeek): boolean {
    return day === this.today;
  }

  isRest(day: DayOfWeek): boolean {
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    return !entry || entry.isRestDay || !entry.workoutId;
  }

  dayWorkoutName(day: DayOfWeek): string | null {
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    if (!entry || entry.isRestDay || !entry.workoutId) {
      return null;
    }
    return this.programService.workoutName(entry.workoutId);
  }

  /** Compact label for the week strip (avoids truncated long names). */
  dayChip(day: DayOfWeek): string {
    if (this.isRest(day)) {
      return 'Rest';
    }
    const name = this.dayWorkoutName(day) ?? 'Train';
    const word = name.trim().split(/\s+/)[0] ?? name;
    return word.length > 6 ? `${word.slice(0, 5)}…` : word;
  }

  coverFor(workout: Workout): string | null {
    const library = this.exerciseService.exercises();
    for (const item of workout.exercises) {
      const match = library.find((exercise) => exercise.id === item.exerciseId);
      if (match?.imageUrl) {
        return match.imageUrl;
      }
    }
    return null;
  }

  scheduledCount(): number {
    return this.schedule().filter((entry) => !entry.isRestDay && entry.workoutId).length;
  }
}
