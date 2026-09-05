import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayOfWeek } from '../../../core/models';
import { WorkoutProgramService, WorkoutService } from '../../../core/services';
import { DAY_LABEL, DAY_ORDER } from '../../../core/utils';

@Component({
  selector: 'app-program',
  imports: [RouterLink],
  templateUrl: './program.component.html',
  styleUrl: './program.component.scss',
})
export class ProgramComponent implements OnInit {
  private readonly programService = inject(WorkoutProgramService);
  private readonly workoutService = inject(WorkoutService);

  readonly days = DAY_ORDER;
  readonly dayLabel = DAY_LABEL;
  readonly program = this.programService.program;
  readonly schedule = this.programService.schedule;
  readonly workouts = this.workoutService.sortedWorkouts;

  readonly loading = signal(true);
  readonly savingDay = signal<DayOfWeek | null>(null);
  readonly nameDraft = signal('');

  async ngOnInit(): Promise<void> {
    await Promise.all([this.workoutService.load(), this.programService.load()]);
    this.nameDraft.set(this.program()?.name ?? 'My Program');
    this.loading.set(false);
  }

  onNameInput(event: Event): void {
    this.nameDraft.set((event.target as HTMLInputElement).value);
  }

  async saveName(): Promise<void> {
    await this.programService.rename(this.nameDraft());
  }

  workoutIdFor(day: DayOfWeek): string {
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    if (!entry || entry.isRestDay) {
      return '';
    }
    return entry.workoutId ?? '';
  }

  async onDayAssign(day: DayOfWeek, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    this.savingDay.set(day);
    try {
      if (value === '') {
        await this.programService.assignDay(day, null, true);
      } else {
        await this.programService.assignDay(day, value, false);
      }
    } finally {
      this.savingDay.set(null);
    }
  }
}
