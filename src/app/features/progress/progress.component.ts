import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-progress',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Progress" subtitle="Streaks and personal records" />`,
})
export class ProgressComponent {}
