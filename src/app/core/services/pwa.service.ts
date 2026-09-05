import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { AppDatabase, DEFAULT_USER_ID, ExerciseRepository, UserRepository } from '../storage';

export type OfflineReadiness = {
  indexedDbAvailable: boolean;
  databaseOpen: boolean;
  userReady: boolean;
  exercisesReady: boolean;
  exerciseCount: number;
  ok: boolean;
  checkedAt: Date;
  message: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const INSTALL_DISMISS_KEY = 'gymtracker.install.dismissed';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly db = inject(AppDatabase);
  private readonly users = inject(UserRepository);
  private readonly exercises = inject(ExerciseRepository);

  private readonly onlineSignal = signal(true);
  private readonly updateReadySignal = signal(false);
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installDismissedSignal = signal(false);
  private readonly standaloneSignal = signal(false);
  private readonly readinessSignal = signal<OfflineReadiness | null>(null);

  readonly online = this.onlineSignal.asReadonly();
  readonly updateReady = this.updateReadySignal.asReadonly();
  readonly installDismissed = this.installDismissedSignal.asReadonly();
  readonly isStandalone = this.standaloneSignal.asReadonly();
  readonly readiness = this.readinessSignal.asReadonly();

  readonly canInstall = computed(
    () =>
      this.deferredPrompt() !== null &&
      !this.standaloneSignal() &&
      !this.installDismissedSignal(),
  );

  readonly showInstallBanner = computed(() => this.canInstall());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.onlineSignal.set(navigator.onLine);
    this.standaloneSignal.set(isStandaloneDisplay());
    this.installDismissedSignal.set(localStorage.getItem(INSTALL_DISMISS_KEY) === '1');

    window.addEventListener('online', () => this.onlineSignal.set(true));
    window.addEventListener('offline', () => this.onlineSignal.set(false));
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt.set(null);
      this.standaloneSignal.set(true);
    });

    if (this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => this.updateReadySignal.set(true));

      void this.swUpdate.checkForUpdate().catch(() => undefined);
    }
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const promptEvent = this.deferredPrompt();
    if (!promptEvent) {
      return 'unavailable';
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    this.deferredPrompt.set(null);
    if (choice.outcome === 'accepted') {
      this.standaloneSignal.set(true);
    }
    return choice.outcome;
  }

  dismissInstall(): void {
    this.installDismissedSignal.set(true);
    this.deferredPrompt.set(null);
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate?.isEnabled) {
      return;
    }
    try {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    } catch {
      document.location.reload();
    }
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate?.isEnabled) {
      return false;
    }
    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  async verifyOfflineDataAccess(): Promise<OfflineReadiness> {
    const checkedAt = new Date();
    const indexedDbAvailable = typeof indexedDB !== 'undefined';

    if (!indexedDbAvailable) {
      const result: OfflineReadiness = {
        indexedDbAvailable: false,
        databaseOpen: false,
        userReady: false,
        exercisesReady: false,
        exerciseCount: 0,
        ok: false,
        checkedAt,
        message: 'IndexedDB is not available in this browser.',
      };
      this.readinessSignal.set(result);
      return result;
    }

    try {
      if (!this.db.isOpen()) {
        await this.db.open();
      }

      const user = await this.users.getById(DEFAULT_USER_ID);
      const exerciseCount = await this.exercises.count();
      const userReady = !!user;
      const exercisesReady = exerciseCount > 0;
      const ok = userReady && exercisesReady;

      const result: OfflineReadiness = {
        indexedDbAvailable: true,
        databaseOpen: true,
        userReady,
        exercisesReady,
        exerciseCount,
        ok,
        checkedAt,
        message: ok
          ? `Local data ready · ${exerciseCount} exercises`
          : 'Local data incomplete — reopen the app online once to finish setup.',
      };
      this.readinessSignal.set(result);
      return result;
    } catch {
      const result: OfflineReadiness = {
        indexedDbAvailable: true,
        databaseOpen: false,
        userReady: false,
        exercisesReady: false,
        exerciseCount: 0,
        ok: false,
        checkedAt,
        message: 'Could not open the local database.',
      };
      this.readinessSignal.set(result);
      return result;
    }
  }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const mediaStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return Boolean(mediaStandalone || iosStandalone);
}
