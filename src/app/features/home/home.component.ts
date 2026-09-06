import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Workout } from '../../core/models';
import {
  ActiveWorkoutService,
  AuthService,
  GamificationService,
  ProgressService,
  SyncService,
  WorkoutProgramService,
  WorkoutService,
} from '../../core/services';
import { DEFAULT_USER_ID, UserRepository } from '../../core/storage';
import type { ProgressPrItem } from '../../core/services/progress.service';
import type { WeekDayStatus } from '../../core/utils';

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
  private readonly gamification = inject(GamificationService);
  private readonly users = inject(UserRepository);
  private readonly auth = inject(AuthService);
  private readonly sync = inject(SyncService);

  readonly today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  readonly greeting = signal('Good morning');
  readonly userName = signal('Athlete');
  readonly initials = signal('A');

  readonly todaysWorkout = signal<Workout | null>(null);
  readonly tomorrowsWorkout = signal<Workout | null>(null);
  readonly hasActiveSession = signal(false);
  readonly isPaused = signal(false);
  readonly loading = signal(true);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);

  readonly streak = signal(0);
  readonly weekDays = signal<WeekDayStatus[]>([]);
  readonly totalWorkouts = signal(0);
  readonly weekCompleted = signal(0);
  readonly weekPlanned = signal(0);
  readonly totalVolumeLabel = signal('0');
  readonly latestPr = signal<ProgressPrItem | null>(null);

  async ngOnInit(): Promise<void> {
    this.greeting.set(greetingForNow());

    await Promise.all([
      this.programService.load(),
      this.activeWorkout.hydrate(),
      this.progressService.load(),
      this.gamification.load(),
      this.sync.ensureLocalProfile(),
    ]);

    const userId = this.auth.userId() ?? DEFAULT_USER_ID;
    const user = await this.users.getById(userId);
    const name =
      user?.name?.trim() ||
      (this.auth.isAuthenticated() ? this.auth.displayName() : 'Athlete');
    this.userName.set(name);
    this.initials.set(initialsFrom(name));

    const todayWorkout = await this.programService.getTodaysWorkout();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowWorkout = await this.programService.getTodaysWorkout(tomorrow);

    this.todaysWorkout.set(todayWorkout ?? null);
    this.tomorrowsWorkout.set(tomorrowWorkout ?? null);
    this.hasActiveSession.set(this.activeWorkout.hasActiveSession());
    this.isPaused.set(this.activeWorkout.isPaused());

    const overview = this.progressService.overview();
    this.streak.set(overview?.streaks.current ?? 0);
    this.weekDays.set(overview?.weekDays ?? []);
    this.totalWorkouts.set(overview?.volume.workoutCount ?? 0);
    this.weekCompleted.set(overview?.weekDays.filter((day) => day.completed).length ?? 0);
    this.weekPlanned.set(Math.max(this.scheduledDaysPerWeek(), 1));
    this.totalVolumeLabel.set(formatVolume(overview?.volume.totalKg ?? 0));

    const topPr = overview?.personalRecords[0];
    this.latestPr.set(topPr ?? null);

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

  private scheduledDaysPerWeek(): number {
    return this.programService
      .schedule()
      .filter((entry) => !entry.isRestDay && !!entry.workoutId).length;
  }
}

function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function initialsFrom(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatVolume(kg: number): string {
  if (kg >= 10_000) {
    return `${(kg / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k`;
  }
  return kg.toLocaleString();
}
