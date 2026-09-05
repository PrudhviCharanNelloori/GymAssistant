import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoryService, type ExerciseHistory } from '../../core/services';
import { formatEnumLabel } from '../../core/utils';

@Component({
  selector: 'app-exercise-history',
  imports: [RouterLink],
  templateUrl: './exercise-history.component.html',
  styleUrl: './exercise-history.component.scss',
})
export class ExerciseHistoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly historyService = inject(HistoryService);

  readonly formatLabel = formatEnumLabel;
  readonly history = signal<ExerciseHistory | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('exerciseId');
    if (!id) {
      this.error.set('Exercise not found');
      this.loading.set(false);
      return;
    }

    const history = await this.historyService.getExerciseHistory(id);
    if (!history) {
      this.error.set('Exercise not found');
      this.loading.set(false);
      return;
    }

    this.history.set(history);
    this.loading.set(false);
  }
}
