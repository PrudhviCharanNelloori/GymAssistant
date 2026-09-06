import { WeeklySchedule } from './weekly-schedule.interface';
import type { Syncable } from './sync.interface';

export interface WorkoutProgram extends Syncable {
  id: string;
  name: string;
  description?: string;
  schedule: WeeklySchedule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
