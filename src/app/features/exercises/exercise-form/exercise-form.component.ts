import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Equipment,
  MuscleGroup,
  TrackingMetric,
} from '../../../core/models';
import { ExerciseService } from '../../../core/services';
import { formatEnumLabel } from '../../../core/utils';

@Component({
  selector: 'app-exercise-form',
  imports: [RouterLink],
  templateUrl: './exercise-form.component.html',
  styleUrl: './exercise-form.component.scss',
})
export class ExerciseFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly exerciseService = inject(ExerciseService);

  readonly muscleGroups = Object.values(MuscleGroup);
  readonly equipmentOptions = Object.values(Equipment);
  readonly formatLabel = formatEnumLabel;

  readonly isEdit = signal(false);
  readonly exerciseId = signal<string | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly instructionsText = signal('');
  readonly primaryMuscleGroup = signal<MuscleGroup>(MuscleGroup.CHEST);
  readonly selectedEquipment = signal<Equipment[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.isEdit.set(true);
    this.exerciseId.set(id);
    this.loading.set(true);

    if (!this.exerciseService.isLoaded()) {
      await this.exerciseService.load();
    }

    const exercise = await this.exerciseService.getById(id);
    if (!exercise || !exercise.isCustom) {
      this.error.set('Only custom exercises can be edited');
      this.loading.set(false);
      return;
    }

    this.name.set(exercise.name);
    this.description.set(exercise.description ?? '');
    this.instructionsText.set((exercise.instructions ?? []).join('\n'));
    this.primaryMuscleGroup.set(exercise.primaryMuscleGroup);
    this.selectedEquipment.set([...exercise.equipment]);
    this.loading.set(false);
  }

  onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  onInstructionsInput(event: Event): void {
    this.instructionsText.set((event.target as HTMLTextAreaElement).value);
  }

  onMuscleChange(event: Event): void {
    this.primaryMuscleGroup.set((event.target as HTMLSelectElement).value as MuscleGroup);
  }

  toggleEquipment(equipment: Equipment): void {
    this.selectedEquipment.update((current) =>
      current.includes(equipment)
        ? current.filter((item) => item !== equipment)
        : [...current, equipment],
    );
  }

  isEquipmentSelected(equipment: Equipment): boolean {
    return this.selectedEquipment().includes(equipment);
  }

  canSave(): boolean {
    return this.name().trim().length > 0 && !this.saving();
  }

  async save(): Promise<void> {
    if (!this.canSave()) {
      return;
    }

    const name = this.name().trim();
    const description = this.description().trim();
    const instructions = this.instructionsText()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    this.saving.set(true);
    this.error.set(null);

    try {
      if (this.isEdit()) {
        const id = this.exerciseId();
        if (!id) {
          throw new Error('Missing exercise id');
        }

        await this.exerciseService.updateExercise(id, {
          name,
          description: description || undefined,
          instructions: instructions.length ? instructions : undefined,
          primaryMuscleGroup: this.primaryMuscleGroup(),
          equipment: this.selectedEquipment(),
        });

        await this.router.navigate(['/exercises', id]);
        return;
      }

      const created = await this.exerciseService.createCustom({
        name,
        description: description || undefined,
        instructions: instructions.length ? instructions : undefined,
        primaryMuscleGroup: this.primaryMuscleGroup(),
        secondaryMuscleGroups: [],
        equipment: this.selectedEquipment(),
        trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      });

      await this.router.navigate(['/exercises', created.id]);
    } catch {
      this.error.set('Could not save exercise');
      this.saving.set(false);
    }
  }
}
