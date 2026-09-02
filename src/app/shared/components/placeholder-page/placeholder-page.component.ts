import { Component, input } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <section class="placeholder">
      <h1 class="placeholder__title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="placeholder__subtitle">{{ subtitle() }}</p>
      }
      <p class="placeholder__message">Coming soon</p>
    </section>
  `,
  styles: `
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
      padding: 1.5rem;
    }

    .placeholder__title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    .placeholder__subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary);
      margin: 0 0 1rem;
    }

    .placeholder__message {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin: 0;
    }
  `,
})
export class PlaceholderPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
