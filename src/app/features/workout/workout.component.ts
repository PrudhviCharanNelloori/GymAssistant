import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-workout',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Active Workout" subtitle="Workout execution" />`,
})
export class WorkoutComponent {}
