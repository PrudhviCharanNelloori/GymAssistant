import { SetResult } from './set-result.interface';

export interface ExerciseSession {
  id: string;
  exerciseId: string;
  workoutExerciseId: string;
  order: number;
  sets: SetResult[];
  notes?: string;
}
