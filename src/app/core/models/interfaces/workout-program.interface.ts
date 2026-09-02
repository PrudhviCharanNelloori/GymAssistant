import { WeeklySchedule } from './weekly-schedule.interface';

export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  schedule: WeeklySchedule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
