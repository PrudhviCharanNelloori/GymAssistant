import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section class="home">
      <p class="home__date">{{ today }}</p>
      <h1 class="home__title">Gym Workout Tracker</h1>
      <p class="home__phase">Phase 1 — Foundation</p>
      <div class="home__card">
        <p class="home__card-label">Today's Workout</p>
        <p class="home__card-value">Not configured yet</p>
        <p class="home__card-hint">Workout programs will be available in Phase 4</p>
      </div>
    </section>
  `,
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
