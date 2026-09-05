import {
  buildMonthStreakCalendar,
  computePersonalRecords,
  computeStreaks,
  computeVolumeSummary,
  exerciseProgression,
  last7DaysStatus,
  toDayKey,
} from './progress-stats';
import {
  SetType,
  TrackingMetric,
  WorkoutSessionStatus,
  type SetResult,
  type WorkoutSession,
} from '../models';

function metric(metric: TrackingMetric, value: number) {
  return { metric, value };
}

function set(partial: Partial<SetResult> & { setNumber: number }): SetResult {
  return {
    id: partial.id ?? `set-${partial.setNumber}`,
    setNumber: partial.setNumber,
    setType: partial.setType ?? SetType.NORMAL,
    completed: partial.completed ?? true,
    actualMetrics: partial.actualMetrics ?? [],
    completedAt: partial.completedAt,
  };
}

function session(
  id: string,
  completedAt: Date,
  exercises: WorkoutSession['exercises'],
): WorkoutSession {
  return {
    id,
    workoutId: 'w1',
    startedAt: new Date(completedAt.getTime() - 45 * 60_000),
    completedAt,
    status: WorkoutSessionStatus.COMPLETED,
    exercises,
  };
}

describe('progress-stats', () => {
  const noon = (isoDate: string) => new Date(`${isoDate}T12:00:00`);

  it('computes current and longest streaks', () => {
    const today = noon('2026-03-10');
    const sessions = [
      session('1', noon('2026-03-10'), []),
      session('2', noon('2026-03-09'), []),
      session('3', noon('2026-03-08'), []),
      session('4', noon('2026-03-05'), []),
      session('5', noon('2026-03-04'), []),
    ];

    expect(computeStreaks(sessions, today)).toEqual({ current: 3, longest: 3 });
  });

  it('returns zero current streak when yesterday and today are missed', () => {
    const today = noon('2026-03-10');
    const sessions = [session('1', noon('2026-03-07'), [])];
    expect(computeStreaks(sessions, today).current).toBe(0);
  });

  it('summarizes total and weekly volume', () => {
    const today = noon('2026-03-10'); // Tuesday
    const exercises: WorkoutSession['exercises'] = [
      {
        id: 'es1',
        exerciseId: 'bench',
        workoutExerciseId: 'we1',
        order: 0,
        sets: [
          set({
            setNumber: 1,
            actualMetrics: [metric(TrackingMetric.WEIGHT, 100), metric(TrackingMetric.REPS, 5)],
          }),
        ],
      },
    ];

    const sessions = [
      session('1', noon('2026-03-10'), exercises), // this week
      session('2', noon('2026-03-01'), exercises), // previous week (Sun before Mon 3/9? Mar 1 is Sunday, week starts Mon Mar 9... wait Mar 10 2026 is Tuesday. Week start Mon Mar 9. Mar 1 is previous week.)
    ];

    const summary = computeVolumeSummary(sessions, today);
    expect(summary.workoutCount).toBe(2);
    expect(summary.totalKg).toBe(1000);
    expect(summary.thisWeekKg).toBe(500);
  });

  it('builds personal records and progression points', () => {
    const sessions = [
      session('1', noon('2026-03-01'), [
        {
          id: 'es1',
          exerciseId: 'bench',
          workoutExerciseId: 'we1',
          order: 0,
          sets: [
            set({
              setNumber: 1,
              actualMetrics: [metric(TrackingMetric.WEIGHT, 80), metric(TrackingMetric.REPS, 5)],
            }),
          ],
        },
      ]),
      session('2', noon('2026-03-08'), [
        {
          id: 'es2',
          exerciseId: 'bench',
          workoutExerciseId: 'we1',
          order: 0,
          sets: [
            set({
              setNumber: 1,
              actualMetrics: [metric(TrackingMetric.WEIGHT, 90), metric(TrackingMetric.REPS, 5)],
            }),
          ],
        },
      ]),
    ];

    const prs = computePersonalRecords(sessions);
    expect(prs).toHaveLength(1);
    expect(prs[0].label).toBe('90 kg × 5');
    expect(prs[0].sessionId).toBe('2');

    const points = exerciseProgression(sessions, 'bench');
    expect(points).toHaveLength(2);
    expect(points[0].bestScore).toBe(400);
    expect(points[1].bestScore).toBe(450);
  });

  it('marks last 7 days completion', () => {
    const today = noon('2026-03-10');
    const sessions = [session('1', noon('2026-03-10'), []), session('2', noon('2026-03-08'), [])];
    const week = last7DaysStatus(sessions, today);
    expect(week).toHaveLength(7);
    expect(week[6].dayKey).toBe(toDayKey(today));
    expect(week[6].completed).toBe(true);
    expect(week[4].completed).toBe(true);
  });

  it('builds a Monday-first monthly streak calendar', () => {
    const today = noon('2026-03-10');
    // March 1 2026 = Sunday → 6 leading blanks in Mon-first grid
    const calendar = buildMonthStreakCalendar(
      ['2026-03-01', '2026-03-10', '2026-03-15'],
      2026,
      2,
      today,
    );

    expect(calendar.workoutDaysInMonth).toBe(3);
    expect(calendar.cells[0].inMonth).toBe(false);
    expect(calendar.cells[6].dayOfMonth).toBe(1);
    expect(calendar.cells[6].completed).toBe(true);

    const tenth = calendar.cells.find((cell) => cell.dayOfMonth === 10);
    expect(tenth?.completed).toBe(true);
    expect(tenth?.isToday).toBe(true);

    const fifteenth = calendar.cells.find((cell) => cell.dayOfMonth === 15);
    expect(fifteenth?.isFuture).toBe(true);
    expect(fifteenth?.completed).toBe(true);
  });
});
