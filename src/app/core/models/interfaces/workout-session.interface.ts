import { WorkoutSessionStatus } from '../enums/workout-session-status.enum';
import { ExerciseSession } from './exercise-session.interface';
import type { Syncable } from './sync.interface';

export interface WorkoutSession extends Syncable {
  id: string;
  workoutId: string;
  programId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: WorkoutSessionStatus;
  exercises: ExerciseSession[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
