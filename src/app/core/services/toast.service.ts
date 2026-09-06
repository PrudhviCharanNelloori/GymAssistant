import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly message = signal<string | null>(null);
  private readonly busy = signal(false);
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  readonly text = this.message.asReadonly();
  readonly isBusy = this.busy.asReadonly();

  show(text: string, durationMs = 2200): void {
    this.clearTimerFn();
    this.busy.set(false);
    this.message.set(text);
    this.clearTimer = setTimeout(() => {
      this.message.set(null);
      this.clearTimer = null;
    }, durationMs);
  }

  showBusy(text = 'Saving…'): void {
    this.clearTimerFn();
    this.busy.set(true);
    this.message.set(text);
  }

  done(text: string, durationMs = 2200): void {
    this.show(text, durationMs);
  }

  clear(): void {
    this.clearTimerFn();
    this.busy.set(false);
    this.message.set(null);
  }

  private clearTimerFn(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
  }
}
