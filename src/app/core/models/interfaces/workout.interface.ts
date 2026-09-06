import { WorkoutExercise } from './workout-exercise.interface';
import type { Syncable } from './sync.interface';

export interface Workout extends Syncable {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}
