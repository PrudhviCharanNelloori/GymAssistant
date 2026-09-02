import { DayOfWeek } from '../enums/day-of-week.enum';

export interface WeeklySchedule {
  id: string;
  dayOfWeek: DayOfWeek;
  workoutId?: string;
  isRestDay: boolean;
}
