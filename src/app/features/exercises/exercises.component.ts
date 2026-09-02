import { Component } from '@angular/core';
import { PlaceholderPageComponent } from '../../shared/components/placeholder-page/placeholder-page.component';

@Component({
  selector: 'app-exercises',
  imports: [PlaceholderPageComponent],
  template: `<app-placeholder-page title="Exercises" subtitle="Exercise library" />`,
})
export class ExercisesComponent {}
