import { WorkoutSessionStatus } from '../enums/workout-session-status.enum';
import { ExerciseSession } from './exercise-session.interface';

export interface WorkoutSession {
  id: string;
  workoutId: string;
  programId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: WorkoutSessionStatus;
  exercises: ExerciseSession[];
  notes?: string;
}
