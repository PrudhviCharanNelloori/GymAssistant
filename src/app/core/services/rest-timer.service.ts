import { Injectable, computed, signal } from '@angular/core';

/**
 * Runtime rest timer — decoupled from session persistence.
 * Supports start, pause, resume, skip, and +/- adjustments.
 */
@Injectable({ providedIn: 'root' })
export class RestTimerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private readonly remaining = signal(0);
  private readonly running = signal(false);
  private readonly active = signal(false);

  readonly secondsRemaining = this.remaining.asReadonly();
  readonly isRunning = this.running.asReadonly();
  readonly isActive = this.active.asReadonly();

  readonly display = computed(() => {
    const total = Math.max(0, this.remaining());
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  start(seconds: number): void {
    this.clearInterval();
    this.remaining.set(Math.max(0, Math.round(seconds)));
    this.active.set(true);
    this.running.set(true);
    this.tick();
  }

  pause(): void {
    if (!this.active() || !this.running()) {
      return;
    }
    this.running.set(false);
    this.clearInterval();
  }

  resume(): void {
    if (!this.active() || this.running() || this.remaining() <= 0) {
      return;
    }
    this.running.set(true);
    this.tick();
  }

  skip(): void {
    this.stop();
  }

  addSeconds(amount: number): void {
    if (!this.active()) {
      return;
    }
    this.remaining.update((value) => Math.max(0, value + amount));
  }

  stop(): void {
    this.clearInterval();
    this.remaining.set(0);
    this.running.set(false);
    this.active.set(false);
  }

  private tick(): void {
    this.clearInterval();
    this.intervalId = setInterval(() => {
      const next = this.remaining() - 1;
      if (next <= 0) {
        this.remaining.set(0);
        this.stop();
        return;
      }
      this.remaining.set(next);
    }, 1000);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
