import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-history',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="History" subtitle="Completed workouts" />`,
})
export class HistoryComponent {}
