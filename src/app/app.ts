import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PwaService } from './core/services';
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

  readonly hideNav = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/session')),
      startWith(this.router.url.startsWith('/session')),
    ),
    { initialValue: false },
  );

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
