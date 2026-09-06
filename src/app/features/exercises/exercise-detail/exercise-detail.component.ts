import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Exercise, MuscleGroup } from '../../../core/models';
import { ExerciseService } from '../../../core/services';
import { formatEnumLabel, toYouTubeEmbedUrl, youtubeFormSearchUrl } from '../../../core/utils';

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
  private readonly sanitizer = inject(DomSanitizer);

  readonly formatLabel = formatEnumLabel;
  readonly exercise = signal<Exercise | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deleting = signal(false);

  readonly guideUrl = computed(() => {
    const item = this.exercise();
    if (!item) return null;
    if (item.videoUrl?.trim()) return item.videoUrl.trim();
    return youtubeFormSearchUrl(item.name);
  });

  readonly embedUrl = computed((): SafeResourceUrl | null => {
    const raw = this.exercise()?.videoUrl?.trim();
    if (!raw) return null;
    const embed = toYouTubeEmbedUrl(raw);
    return embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
  });

  readonly muscleTone = computed(() => muscleTone(this.exercise()?.primaryMuscleGroup));

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

function muscleTone(group?: MuscleGroup): string {
  switch (group) {
    case 'CHEST':
      return 'chest';
    case 'BACK':
      return 'back';
    case 'SHOULDERS':
      return 'shoulders';
    case 'BICEPS':
    case 'TRICEPS':
    case 'FOREARMS':
      return 'arms';
    case 'QUADS':
    case 'HAMSTRINGS':
    case 'GLUTES':
    case 'CALVES':
      return 'legs';
    case 'CORE':
      return 'core';
    case 'CARDIO':
      return 'cardio';
    default:
      return 'full';
  }
}
