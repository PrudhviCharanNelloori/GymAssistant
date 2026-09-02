import { WorkoutExercise } from './workout-exercise.interface';

export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}
