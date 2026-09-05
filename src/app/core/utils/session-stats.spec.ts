import {
  formatExerciseSessionSummary,
  formatSetResult,
  summarizeSession,
} from './session-stats';
import {
  SetType,
  TrackingMetric,
  WorkoutSessionStatus,
  type ExerciseSession,
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

describe('session-stats', () => {
  it('summarizes duration, sets, and volume', () => {
    const session: WorkoutSession = {
      id: 's1',
      workoutId: 'w1',
      startedAt: new Date('2026-01-01T10:00:00Z'),
      completedAt: new Date('2026-01-01T10:45:00Z'),
      status: WorkoutSessionStatus.COMPLETED,
      exercises: [
        {
          id: 'es1',
          exerciseId: 'e1',
          workoutExerciseId: 'we1',
          order: 0,
          sets: [
            set({
              setNumber: 1,
              actualMetrics: [metric(TrackingMetric.WEIGHT, 60), metric(TrackingMetric.REPS, 8)],
            }),
            set({
              setNumber: 2,
              completed: false,
              actualMetrics: [],
            }),
          ],
        },
      ],
    };

    const stats = summarizeSession(session);
    expect(stats.durationMinutes).toBe(45);
    expect(stats.completedSets).toBe(1);
    expect(stats.totalSets).toBe(2);
    expect(stats.volumeKg).toBe(480);
    expect(stats.completionRate).toBe(50);
    expect(stats.exerciseCount).toBe(1);
  });

  it('formats set and exercise summaries', () => {
    const logged = set({
      setNumber: 1,
      actualMetrics: [metric(TrackingMetric.WEIGHT, 100), metric(TrackingMetric.REPS, 5)],
    });
    expect(formatSetResult(logged)).toBe('100 kg × 5');

    const exercise: ExerciseSession = {
      id: 'es1',
      exerciseId: 'e1',
      workoutExerciseId: 'we1',
      order: 0,
      sets: [logged, set({ setNumber: 2, completed: false })],
    };
    expect(formatExerciseSessionSummary(exercise)).toBe('100 kg × 5');
  });
});
