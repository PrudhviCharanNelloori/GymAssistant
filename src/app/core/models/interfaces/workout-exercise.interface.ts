import { SetTarget } from './set-target.interface';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: SetTarget[];
  restSeconds?: number;
  notes?: string;
  isOptional?: boolean;
}
