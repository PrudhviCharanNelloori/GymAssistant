import { Injectable, inject } from '@angular/core';
import { toBuiltInExerciseInputs } from '../data/built-in-exercises';
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

  private async ensureBuiltInExercises(): Promise<void> {
    const builtInCount = (await this.exercises.getBuiltInExercises()).length;
    if (builtInCount > 0) {
      return;
    }

    await this.exercises.bulkCreate(toBuiltInExerciseInputs());
  }
}
