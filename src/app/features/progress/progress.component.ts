import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GamificationService, ProgressService } from '../../core/services';
import {
  buildMonthStreakCalendar,
  type ProgressionPoint,
  type WeeklyVolumePoint,
} from '../../core/utils';

@Component({
  selector: 'app-progress',
  imports: [RouterLink],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements OnInit {
  private readonly progressService = inject(ProgressService);
  private readonly gamification = inject(GamificationService);

  readonly loading = signal(true);
  readonly overview = this.progressService.overview;
  readonly game = this.gamification.snapshot;
  readonly selectedId = this.progressService.selectedId;
  readonly progression = this.progressService.selectedProgression;
  readonly selectedName = this.progressService.selectedExerciseName;

  /** 0 = current month, -1 = previous, etc. */
  readonly monthOffset = signal(0);

  readonly maxWeeklyVolume = computed(() => {
    const points = this.overview()?.weeklyVolume ?? [];
    return Math.max(1, ...points.map((point) => point.volumeKg));
  });

  readonly monthCalendar = computed(() => {
    const today = new Date();
    const cursor = new Date(today.getFullYear(), today.getMonth() + this.monthOffset(), 1);
    return buildMonthStreakCalendar(
      this.overview()?.completedDayKeys ?? [],
      cursor.getFullYear(),
      cursor.getMonth(),
      today,
    );
  });

  readonly chart = computed(() => buildLineChart(this.progression()));

  async ngOnInit(): Promise<void> {
    await Promise.all([this.progressService.load(), this.gamification.load()]);
    this.loading.set(false);
  }

  selectExercise(exerciseId: string): void {
    this.progressService.selectExercise(exerciseId);
  }

  previousMonth(): void {
    this.monthOffset.update((offset) => offset - 1);
  }

  nextMonth(): void {
    if (this.monthOffset() >= 0) {
      return;
    }
    this.monthOffset.update((offset) => offset + 1);
  }

  barHeight(point: WeeklyVolumePoint): number {
    return Math.round((point.volumeKg / this.maxWeeklyVolume()) * 100);
  }
}

function buildLineChart(points: ProgressionPoint[]): {
  path: string;
  dots: Array<{ x: number; y: number; label: string; value: string }>;
  empty: boolean;
} {
  if (points.length === 0) {
    return { path: '', dots: [], empty: true };
  }

  const width = 280;
  const height = 120;
  const padX = 12;
  const padY = 16;
  const scores = points.map((point) => point.bestScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = Math.max(1, max - min);

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - ((point.bestScore - min) / range) * (height - padY * 2);
    return { x, y, label: point.dateLabel, value: point.bestLabel };
  });

  const path = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');

  return { path, dots: coords, empty: false };
}
