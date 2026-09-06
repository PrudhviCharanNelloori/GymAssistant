import { Injectable, inject } from '@angular/core';
import { ExerciseRepository } from '../storage';
import { DEFAULT_USER_ID, UserRepository } from '../storage/repositories/user.repository';

/**
 * Ensures the local single-user profile and built-in exercise catalog exist.
 */
@Injectable({ providedIn: 'root' })
export class BootstrapService {
  private readonly users = inject(UserRepository);
  private readonly exercises = inject(ExerciseRepository);

  async initialize(): Promise<void> {
    await this.ensureDefaultUser();
    await this.ensureBuiltInExercises();
  }

  private async ensureDefaultUser(): Promise<void> {
    const existing = await this.users.getDefaultUser();
    if (existing) {
      return;
    }

    await this.users.createUser({
      id: DEFAULT_USER_ID,
      name: 'Athlete',
    });
  }

  /**
   * Seeds curated RepDB staples; removes obsolete builtin-/exdb- catalog rows.
   */
  private async ensureBuiltInExercises(): Promise<void> {
    const { BUILT_IN_EXERCISE_IDS, toBuiltInExerciseInputs } = await import(
      '../data/built-in-exercises'
    );
    const seeds = toBuiltInExerciseInputs();
    const existingIds = await this.exercises.getAllIds();

    const obsolete = [...existingIds].filter((id) => {
      if (id.startsWith('exdb-') || id.startsWith('builtin-')) return true;
      if (id.startsWith('repdb-') && !BUILT_IN_EXERCISE_IDS.has(id)) return true;
      return false;
    });
    await this.exercises.bulkHardDelete(obsolete);

    for (const seed of seeds) {
      if (!seed.id) continue;
      const existing = await this.exercises.getById(seed.id);
      if (!existing) {
        await this.exercises.bulkCreate([seed]);
        continue;
      }
      await this.exercises.putSynced({
        ...existing,
        name: seed.name,
        description: seed.description,
        primaryMuscleGroup: seed.primaryMuscleGroup,
        secondaryMuscleGroups: seed.secondaryMuscleGroups ?? [],
        equipment: seed.equipment ?? [],
        trackingMetrics: seed.trackingMetrics ?? [],
        instructions: seed.instructions,
        videoUrl: seed.videoUrl,
        imageUrl: seed.imageUrl,
        imageStartUrl: seed.imageStartUrl,
        isCustom: false,
        dirty: false,
        syncStatus: 'synced',
        updatedAt: new Date(),
      });
    }
  }
}
