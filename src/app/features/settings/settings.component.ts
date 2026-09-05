import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../core/services';
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

  readonly loading = signal(true);
  readonly name = signal('Athlete');
  readonly game = signal<GamificationSnapshot | null>(null);

  async ngOnInit(): Promise<void> {
    const [user, snapshot] = await Promise.all([
      this.users.getById(DEFAULT_USER_ID),
      this.gamification.load(),
    ]);
    this.name.set(user?.name ?? 'Athlete');
    this.game.set(snapshot);
    this.loading.set(false);
  }
}
