import {
  SetType,
  TrackingMetric,
  WorkoutSessionStatus,
  type SetResult,
  type WorkoutSession,
} from '../models';
import {
  buildSessionCelebration,
  computeSessionXp,
  detectNewPersonalRecords,
  evaluateMilestones,
  levelFromXp,
  totalXpFromSessions,
} from './gamification';

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
    startedAt: new Date(completedAt.getTime() - 40 * 60_000),
    completedAt,
    status: WorkoutSessionStatus.COMPLETED,
    exercises,
  };
}

describe('gamification', () => {
  const noon = (iso: string) => new Date(`${iso}T12:00:00`);

  it('maps XP into levels', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(149).level).toBe(1);
    expect(levelFromXp(150).level).toBe(2);
    expect(levelFromXp(150).xpIntoLevel).toBe(0);
  });

  it('scores a session with set and completion bonuses', () => {
    const workout = session('s1', noon('2026-03-10'), [
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
          set({
            setNumber: 2,
            actualMetrics: [metric(TrackingMetric.WEIGHT, 100), metric(TrackingMetric.REPS, 5)],
          }),
        ],
      },
    ]);

    const xp = computeSessionXp(workout, { streak: 3, newPrCount: 1 });
    expect(xp.base).toBe(50);
    expect(xp.sets).toBe(10);
    expect(xp.completion).toBe(25);
    expect(xp.streak).toBe(15);
    expect(xp.personalRecords).toBe(30);
    expect(xp.total).toBeGreaterThan(100);
  });

  it('detects new personal records against prior sessions', () => {
    const prior = [
      session('old', noon('2026-03-01'), [
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
    ];

    const next = session('new', noon('2026-03-08'), [
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
    ]);

    const prs = detectNewPersonalRecords(next, prior);
    expect(prs).toHaveLength(1);
    expect(prs[0].label).toBe('90 kg × 5');
    expect(prs[0].previousLabel).toBe('80 kg × 5');
  });

  it('unlocks milestones from snapshot stats', () => {
    const milestones = evaluateMilestones({
      workoutCount: 5,
      longestStreak: 3,
      totalVolumeKg: 6000,
      personalRecordCount: 1,
    });

    expect(milestones.find((m) => m.id === 'workouts_5')?.unlocked).toBe(true);
    expect(milestones.find((m) => m.id === 'streak_3')?.unlocked).toBe(true);
    expect(milestones.find((m) => m.id === 'volume_5k')?.unlocked).toBe(true);
    expect(milestones.find((m) => m.id === 'workouts_10')?.unlocked).toBe(false);
  });

  it('builds a celebration with XP and unlocked milestones', () => {
    const first = session('s1', noon('2026-03-10'), [
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
    ]);

    const celebration = buildSessionCelebration(first, [], noon('2026-03-10'));
    expect(celebration.xp.total).toBeGreaterThan(0);
    expect(celebration.newPersonalRecords).toHaveLength(1);
    expect(celebration.newlyUnlocked.some((m) => m.id === 'first_workout')).toBe(true);
    expect(celebration.newlyUnlocked.some((m) => m.id === 'first_pr')).toBe(true);
    expect(totalXpFromSessions([first], noon('2026-03-10'))).toBe(celebration.xp.total);
  });
});
