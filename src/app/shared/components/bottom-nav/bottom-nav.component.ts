import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: 'home' | 'workouts' | 'progress' | 'history' | 'profile';
}

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" aria-label="Main navigation">
      @for (item of navItems; track item.route) {
        <a
          class="bottom-nav__item"
          [routerLink]="item.route"
          routerLinkActive="bottom-nav__item--active"
          [attr.aria-label]="item.label"
        >
          <span class="bottom-nav__icon" aria-hidden="true">
            @switch (item.icon) {
              @case ('home') {
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              @case ('workouts') {
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.5 9v6M17.5 9v6M4 10.5v3M20 10.5v3M8 12h8M6.5 9h-1a1.5 1.5 0 0 0 0 3h1M6.5 15h-1a1.5 1.5 0 0 1 0-3h1M17.5 9h1a1.5 1.5 0 0 1 0 3h-1M17.5 15h1a1.5 1.5 0 0 0 0-3h-1"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              @case ('progress') {
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 19V10M12 19V5M19 19v-7"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                  />
                </svg>
              }
              @case ('history') {
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75" />
                  <path
                    d="M12 8v4.5L15 15"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
              @case ('profile') {
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.75" />
                  <path
                    d="M5.5 19.5c1.5-3 3.7-4.5 6.5-4.5s5 1.5 6.5 4.5"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                  />
                </svg>
              }
            }
          </span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly navItems: NavItem[] = [
    { label: 'Home', route: '/home', icon: 'home' },
    { label: 'Workouts', route: '/workouts', icon: 'workouts' },
    { label: 'Progress', route: '/progress', icon: 'progress' },
    { label: 'History', route: '/history', icon: 'history' },
    { label: 'Profile', route: '/settings', icon: 'profile' },
  ];
}
