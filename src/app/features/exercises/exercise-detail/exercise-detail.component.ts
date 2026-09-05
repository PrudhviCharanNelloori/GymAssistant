import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Exercise } from '../../../core/models';
import { ExerciseService } from '../../../core/services';
import { formatEnumLabel } from '../../../core/utils';

@Component({
  selector: 'app-exercise-detail',
  imports: [RouterLink],
  templateUrl: './exercise-detail.component.html',
  styleUrl: './exercise-detail.component.scss',
})
export class ExerciseDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly exerciseService = inject(ExerciseService);

  readonly formatLabel = formatEnumLabel;
  readonly exercise = signal<Exercise | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Exercise not found');
      this.loading.set(false);
      return;
    }

    if (!this.exerciseService.isLoaded()) {
      await this.exerciseService.load();
    }

    const exercise = await this.exerciseService.getById(id);
    if (!exercise) {
      this.error.set('Exercise not found');
      this.loading.set(false);
      return;
    }

    this.exercise.set(exercise);
    this.loading.set(false);
  }

  formatLabels(values: string[]): string {
    return values.map((value) => formatEnumLabel(value)).join(', ');
  }

  async deleteExercise(): Promise<void> {
    const current = this.exercise();
    if (!current?.isCustom || this.deleting()) {
      return;
    }

    const confirmed = window.confirm(`Delete “${current.name}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.deleting.set(true);
    try {
      await this.exerciseService.deleteCustom(current.id);
      await this.router.navigate(['/exercises']);
    } catch {
      this.error.set('Could not delete exercise');
      this.deleting.set(false);
    }
  }
}
