import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoryService, type SessionDetail } from '../../core/services';
import { formatSessionDateTime } from '../../core/utils';

@Component({
  selector: 'app-history-detail',
  imports: [RouterLink],
  templateUrl: './history-detail.component.html',
  styleUrl: './history-detail.component.scss',
})
export class HistoryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly historyService = inject(HistoryService);

  readonly detail = signal<SessionDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dateTimeLabel = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('sessionId');
    if (!id) {
      this.error.set('Session not found');
      this.loading.set(false);
      return;
    }

    const detail = await this.historyService.getSessionDetail(id);
    if (!detail) {
      this.error.set('Session not found');
      this.loading.set(false);
      return;
    }

    this.detail.set(detail);
    this.dateTimeLabel.set(formatSessionDateTime(detail.session));
    this.loading.set(false);
  }
}
