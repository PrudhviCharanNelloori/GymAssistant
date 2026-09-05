import type { SetResult, WorkoutSession } from '../models';
import { TrackingMetric } from '../models';
import { formatSetResult, setVolumeKg, summarizeSession } from './session-stats';

export type StreakSummary = {
  current: number;
  longest: number;
};

export type WeekDayStatus = {
  dayKey: string;
  label: string;
  completed: boolean;
  isToday: boolean;
};

export type VolumeSummary = {
  totalKg: number;
  thisWeekKg: number;
  workoutCount: number;
};

export type PersonalRecord = {
  exerciseId: string;
  score: number;
  label: string;
  achievedAt: Date;
  sessionId: string;
};

export type ProgressionPoint = {
  dayKey: string;
  dateLabel: string;
  date: Date;
  bestScore: number;
  bestLabel: string;
  sessionVolumeKg: number;
  sessionId: string;
};

export type WeeklyVolumePoint = {
  dayKey: string;
  label: string;
  volumeKg: number;
};

export type MonthDayCell = {
  dayKey: string | null;
  dayOfMonth: number | null;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  inMonth: boolean;
};

export type MonthStreakCalendar = {
  year: number;
  month: number;
  title: string;
  weekdayLabels: string[];
  cells: MonthDayCell[];
  workoutDaysInMonth: number;
};

/** Local calendar day key YYYY-MM-DD */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function sessionCompletedAt(session: WorkoutSession): Date {
  return new Date(session.completedAt ?? session.startedAt);
}

export function sessionDayKey(session: WorkoutSession): string {
  return toDayKey(sessionCompletedAt(session));
}

export function setPerformanceScore(set: SetResult): number {
  const weight =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.WEIGHT)?.value ?? 0;
  const reps =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.REPS)?.value ?? 0;
  const duration =
    set.actualMetrics.find(
      (metric) =>
        metric.metric === TrackingMetric.DURATION || metric.metric === TrackingMetric.TIME,
    )?.value ?? 0;

  if (weight > 0 && reps > 0) {
    return weight * reps;
  }
  if (reps > 0) {
    return reps;
  }
  return duration;
}

export function pickBestSet(sets: SetResult[]): SetResult | null {
  const completed = sets.filter((set) => set.completed);
  if (completed.length === 0) {
    return null;
  }

  let best = completed[0];
  let bestScore = setPerformanceScore(best);

  for (const set of completed.slice(1)) {
    const score = setPerformanceScore(set);
    if (score > bestScore) {
      best = set;
      bestScore = score;
    }
  }

  return best;
}

export function bestSetLabel(sets: SetResult[]): string {
  const best = pickBestSet(sets);
  return best ? formatSetResult(best) : '—';
}

/** Unique workout days newest-first */
export function workoutDayKeys(sessions: WorkoutSession[]): string[] {
  const days = new Set(sessions.map((session) => sessionDayKey(session)));
  return [...days].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export function computeStreaks(sessions: WorkoutSession[], today = new Date()): StreakSummary {
  const days = workoutDayKeys(sessions);
  if (days.length === 0) {
    return { current: 0, longest: 0 };
  }

  const todayKey = toDayKey(today);
  const yesterdayKey = toDayKey(addDays(today, -1));
  const daySet = new Set(days);

  let current = 0;
  if (daySet.has(todayKey) || daySet.has(yesterdayKey)) {
    let cursor = daySet.has(todayKey) ? today : addDays(today, -1);
    while (daySet.has(toDayKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  let longest = 1;
  let run = 1;
  const ascending = [...days].reverse();
  for (let i = 1; i < ascending.length; i += 1) {
    const prev = parseDayKey(ascending[i - 1]);
    const next = parseDayKey(ascending[i]);
    if (diffDays(prev, next) === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

export function last7DaysStatus(sessions: WorkoutSession[], today = new Date()): WeekDayStatus[] {
  const daySet = new Set(sessions.map((session) => sessionDayKey(session)));
  const todayKey = toDayKey(today);
  const result: WeekDayStatus[] = [];

  for (let offset = -6; offset <= 0; offset += 1) {
    const date = addDays(today, offset);
    const dayKey = toDayKey(date);
    result.push({
      dayKey,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      completed: daySet.has(dayKey),
      isToday: dayKey === todayKey,
    });
  }

  return result;
}

/** Monday-first month grid for streak visualization */
export function buildMonthStreakCalendar(
  completedDayKeys: Iterable<string>,
  year: number,
  month: number,
  today = new Date(),
): MonthStreakCalendar {
  const daySet = completedDayKeys instanceof Set ? completedDayKeys : new Set(completedDayKeys);
  const todayKey = toDayKey(today);
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday = 0 … Sunday = 6
  const firstWeekday = (first.getDay() + 6) % 7;
  const cells: MonthDayCell[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({
      dayKey: null,
      dayOfMonth: null,
      completed: false,
      isToday: false,
      isFuture: false,
      inMonth: false,
    });
  }

  let workoutDaysInMonth = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day, 12, 0, 0, 0);
    const dayKey = toDayKey(date);
    const completed = daySet.has(dayKey);
    if (completed) {
      workoutDaysInMonth += 1;
    }
    cells.push({
      dayKey,
      dayOfMonth: day,
      completed,
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      dayKey: null,
      dayOfMonth: null,
      completed: false,
      isToday: false,
      isFuture: false,
      inMonth: false,
    });
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    // 2024-01-01 was Monday — use a known Monday week for labels
    const labelDate = new Date(2024, 0, 1 + index, 12, 0, 0, 0);
    return labelDate.toLocaleDateString(undefined, { weekday: 'narrow' });
  });

  return {
    year,
    month,
    title: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    weekdayLabels,
    cells,
    workoutDaysInMonth,
  };
}

export function computeVolumeSummary(
  sessions: WorkoutSession[],
  today = new Date(),
): VolumeSummary {
  const weekStart = startOfWeek(today);
  let totalKg = 0;
  let thisWeekKg = 0;

  for (const session of sessions) {
    const volume = summarizeSession(session).volumeKg;
    totalKg += volume;
    if (sessionCompletedAt(session) >= weekStart) {
      thisWeekKg += volume;
    }
  }

  return {
    totalKg,
    thisWeekKg,
    workoutCount: sessions.length,
  };
}

export function last7DaysVolume(
  sessions: WorkoutSession[],
  today = new Date(),
): WeeklyVolumePoint[] {
  const byDay = new Map<string, number>();

  for (const session of sessions) {
    const key = sessionDayKey(session);
    byDay.set(key, (byDay.get(key) ?? 0) + summarizeSession(session).volumeKg);
  }

  const result: WeeklyVolumePoint[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = addDays(today, offset);
    const dayKey = toDayKey(date);
    result.push({
      dayKey,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      volumeKg: byDay.get(dayKey) ?? 0,
    });
  }

  return result;
}

export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const bestByExercise = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    const achievedAt = sessionCompletedAt(session);
    for (const exercise of session.exercises) {
      const best = pickBestSet(exercise.sets);
      if (!best) continue;

      const score = setPerformanceScore(best);
      if (score <= 0) continue;

      const existing = bestByExercise.get(exercise.exerciseId);
      if (!existing || score > existing.score) {
        bestByExercise.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          score,
          label: formatSetResult(best),
          achievedAt,
          sessionId: session.id,
        });
      }
    }
  }

  return [...bestByExercise.values()].sort((a, b) => b.score - a.score);
}

export function exerciseProgression(
  sessions: WorkoutSession[],
  exerciseId: string,
): ProgressionPoint[] {
  const points: ProgressionPoint[] = [];

  for (const session of sessions) {
    const match = session.exercises.find((item) => item.exerciseId === exerciseId);
    if (!match) continue;

    const best = pickBestSet(match.sets);
    if (!best) continue;

    const date = sessionCompletedAt(session);
    points.push({
      dayKey: toDayKey(date),
      dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      date,
      bestScore: setPerformanceScore(best),
      bestLabel: formatSetResult(best),
      sessionVolumeKg: Math.round(
        match.sets.filter((set) => set.completed).reduce((sum, set) => sum + setVolumeKg(set), 0),
      ),
      sessionId: session.id,
    });
  }

  return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function diffDays(a: Date, b: Date): number {
  const ms = b.setHours(12, 0, 0, 0) - a.setHours(12, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

/** Monday 00:00 local as week start */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}
