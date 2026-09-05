import { DayOfWeek, type WeeklySchedule } from '../models';
import { createId } from './id';

export const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const DAY_SHORT: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Mon',
  [DayOfWeek.TUESDAY]: 'Tue',
  [DayOfWeek.WEDNESDAY]: 'Wed',
  [DayOfWeek.THURSDAY]: 'Thu',
  [DayOfWeek.FRIDAY]: 'Fri',
  [DayOfWeek.SATURDAY]: 'Sat',
  [DayOfWeek.SUNDAY]: 'Sun',
};

export const DAY_LABEL: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday',
};

export function createEmptyWeekSchedule(): WeeklySchedule[] {
  return DAY_ORDER.map((dayOfWeek) => ({
    id: createId(),
    dayOfWeek,
    isRestDay: dayOfWeek === DayOfWeek.SATURDAY || dayOfWeek === DayOfWeek.SUNDAY,
    workoutId: undefined,
  }));
}

export function dayOfWeekFromDate(date: Date = new Date()): DayOfWeek {
  const map: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  return map[date.getDay()];
}

export function normalizeSchedule(schedule: WeeklySchedule[]): WeeklySchedule[] {
  const byDay = new Map(schedule.map((entry) => [entry.dayOfWeek, entry]));

  return DAY_ORDER.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    if (existing) {
      return existing;
    }
    return {
      id: createId(),
      dayOfWeek,
      isRestDay: false,
      workoutId: undefined,
    };
  });
}
