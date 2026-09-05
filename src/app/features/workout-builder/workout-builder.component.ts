import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** @deprecated Use /workouts — kept for lazy-load safety if referenced. */
@Component({
  selector: 'app-workout-builder',
  imports: [RouterLink],
  template: `
    <section style="padding: 1.5rem; text-align: center">
      <p>Moved to Workouts.</p>
      <a routerLink="/workouts">Open workouts</a>
    </section>
  `,
})
export class WorkoutBuilderComponent {}
