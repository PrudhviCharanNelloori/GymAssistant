import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PwaService, ToastService } from './core/services';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';

@Component({
  imports: [RouterOutlet, BottomNavComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  readonly pwa = inject(PwaService);
  readonly toast = inject(ToastService);

  readonly hideNav = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.isSessionOrAuth()),
      startWith(this.isSessionOrAuth()),
    ),
    { initialValue: false },
  );

  readonly isAuthRoute = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/auth')),
      startWith(this.router.url.startsWith('/auth')),
    ),
    { initialValue: false },
  );

  private isSessionOrAuth(): boolean {
    const url = this.router.url;
    return url.startsWith('/session') || url.startsWith('/auth');
  }

  ngOnInit(): void {
    void this.pwa.verifyOfflineDataAccess();
  }

  install(): void {
    void this.pwa.promptInstall();
  }

  dismissInstall(): void {
    this.pwa.dismissInstall();
  }

  applyUpdate(): void {
    void this.pwa.applyUpdate();
  }
}
