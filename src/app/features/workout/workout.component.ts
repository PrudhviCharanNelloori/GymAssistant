import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Legacy placeholder route — redirects users via links to the live session flow. */
@Component({
  selector: 'app-workout',
  imports: [RouterLink],
  template: `
    <section style="padding: 1.5rem; text-align: center">
      <p>Start today’s workout from Home.</p>
      <a routerLink="/home">Go home</a>
    </section>
  `,
})
export class WorkoutComponent {}
