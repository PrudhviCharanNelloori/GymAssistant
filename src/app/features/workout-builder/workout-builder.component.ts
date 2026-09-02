import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-workout-builder',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Workout Builder" subtitle="Create and edit workouts" />`,
})
export class WorkoutBuilderComponent {}
