import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section class="home">
      <p class="home__date">{{ today }}</p>
      <h1 class="home__title">Good morning</h1>
      <div class="home__card">
        <div class="home__card-dark">
          <p class="home__card-label">Today's Workout</p>
          <p class="home__card-value">Not configured yet</p>
          <p class="home__card-hint">Workout programs will be available in Phase 4</p>
        </div>
        <div class="home__card-action">
          <button type="button" class="home__start-btn" disabled>
            <span class="home__start-icon" aria-hidden="true">▶</span>
            Start Workout
          </button>
        </div>
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
