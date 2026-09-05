import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HistoryService, type HistoryListItem } from '../../core/services';

@Component({
  selector: 'app-history',
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent implements OnInit {
  private readonly historyService = inject(HistoryService);

  readonly items = this.historyService.history;
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.historyService.load();
    this.loading.set(false);
  }

  meta(item: HistoryListItem): string {
    const { stats } = item;
    return `${stats.exerciseCount} exercises · ${stats.completedSets} sets · ${stats.durationMinutes} min`;
  }
}
