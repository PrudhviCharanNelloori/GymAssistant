import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GamificationService, PwaService, type OfflineReadiness } from '../../core/services';
import { DEFAULT_USER_ID, UserRepository } from '../../core/storage';
import type { GamificationSnapshot } from '../../core/utils';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly users = inject(UserRepository);
  private readonly gamification = inject(GamificationService);
  readonly pwa = inject(PwaService);

  readonly loading = signal(true);
  readonly name = signal('Athlete');
  readonly game = signal<GamificationSnapshot | null>(null);
  readonly readiness = signal<OfflineReadiness | null>(null);
  readonly checking = signal(false);
  readonly updateChecking = signal(false);
  readonly installBusy = signal(false);
  readonly statusMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const [user, snapshot, readiness] = await Promise.all([
      this.users.getById(DEFAULT_USER_ID),
      this.gamification.load(),
      this.pwa.verifyOfflineDataAccess(),
    ]);
    this.name.set(user?.name ?? 'Athlete');
    this.game.set(snapshot);
    this.readiness.set(readiness);
    this.loading.set(false);
  }

  async installApp(): Promise<void> {
    this.installBusy.set(true);
    this.statusMessage.set(null);
    const outcome = await this.pwa.promptInstall();
    this.installBusy.set(false);
    if (outcome === 'unavailable') {
      this.statusMessage.set('Install isn’t available in this browser yet. Use the browser menu if offered.');
    } else if (outcome === 'accepted') {
      this.statusMessage.set('App installed.');
    }
  }

  async recheckStorage(): Promise<void> {
    this.checking.set(true);
    this.statusMessage.set(null);
    const readiness = await this.pwa.verifyOfflineDataAccess();
    this.readiness.set(readiness);
    this.statusMessage.set(readiness.message);
    this.checking.set(false);
  }

  async checkUpdates(): Promise<void> {
    this.updateChecking.set(true);
    this.statusMessage.set(null);
    const found = await this.pwa.checkForUpdate();
    this.statusMessage.set(
      found ? 'Update found — tap Update when the banner appears.' : 'You’re on the latest version.',
    );
    this.updateChecking.set(false);
  }

  applyUpdate(): void {
    void this.pwa.applyUpdate();
  }
}
