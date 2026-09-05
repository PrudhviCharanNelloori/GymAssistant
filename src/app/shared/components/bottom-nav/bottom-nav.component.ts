import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
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
          <span class="bottom-nav__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  readonly navItems: NavItem[] = [
    { label: 'Home', route: '/home', icon: '⌂' },
    { label: 'Workouts', route: '/workouts', icon: '☰' },
    { label: 'Exercises', route: '/exercises', icon: '◎' },
    { label: 'Progress', route: '/progress', icon: '▲' },
    { label: 'Settings', route: '/settings', icon: '⚙' },
  ];
}
