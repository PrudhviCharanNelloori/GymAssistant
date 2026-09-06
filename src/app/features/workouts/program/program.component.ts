import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DayOfWeek } from '../../../core/models';
import { ToastService, WorkoutProgramService, WorkoutService } from '../../../core/services';
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
  private readonly toast = inject(ToastService);

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
    const next = this.nameDraft().trim();
    if (!next || next === (this.program()?.name ?? '')) {
      return;
    }
    this.toast.showBusy('Saving…');
    try {
      await this.programService.rename(this.nameDraft());
      this.toast.done('Program name saved');
    } catch {
      this.toast.show('Could not save program name');
    }
  }

  workoutIdFor(day: DayOfWeek): string {
    const entry = this.schedule().find((item) => item.dayOfWeek === day);
    if (!entry?.workoutId || entry.isRestDay) {
      return '';
    }
    return entry.workoutId;
  }

  async onDayAssign(day: DayOfWeek, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    this.savingDay.set(day);
    this.toast.showBusy('Updating schedule…');
    try {
      if (value === '') {
        await this.programService.assignDay(day, null, true);
      } else {
        await this.programService.assignDay(day, value, false);
      }
      this.toast.done(value === '' ? 'Rest day set' : 'Workout assigned');
    } catch {
      this.toast.show('Could not update schedule');
    } finally {
      this.savingDay.set(null);
    }
  }
}
