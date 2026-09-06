import {
  exerciseFromRow,
  exerciseToRow,
  fromIso,
  sessionFromRow,
  sessionToRow,
  toIso,
  workoutFromRow,
  workoutToRow,
} from './sync-mappers';
import { MuscleGroup, SetType, TrackingMetric, WorkoutSessionStatus } from '../models';

describe('sync-mappers', () => {
  it('serializes dates to ISO and back', () => {
    const d = new Date('2026-06-01T12:00:00.000Z');
    expect(toIso(d)).toBe('2026-06-01T12:00:00.000Z');
    expect(fromIso(toIso(d))?.toISOString()).toBe(d.toISOString());
    expect(toIso(null)).toBeNull();
    expect(fromIso(null)).toBeUndefined();
  });

  it('round-trips an exercise', () => {
    const exercise = {
      id: 'ex1',
      userId: 'user-1',
      name: 'Bench',
      primaryMuscleGroup: MuscleGroup.CHEST,
      secondaryMuscleGroups: [],
      equipment: [],
      trackingMetrics: [TrackingMetric.WEIGHT, TrackingMetric.REPS],
      isCustom: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
      dirty: true,
      syncStatus: 'pending' as const,
    };

    const row = exerciseToRow(exercise, 'user-1');
    const back = exerciseFromRow(row);
    expect(back.id).toBe('ex1');
    expect(back.name).toBe('Bench');
    expect(back.isCustom).toBe(true);
    expect(back.syncStatus).toBe('synced');
    expect(back.dirty).toBe(false);
  });

  it('round-trips a workout and session', () => {
    const workout = {
      id: 'w1',
      userId: 'user-1',
      name: 'Push',
      exercises: [],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    };
    const wRow = workoutToRow(workout, 'user-1');
    expect(workoutFromRow(wRow).name).toBe('Push');

    const session = {
      id: 's1',
      userId: 'user-1',
      workoutId: 'w1',
      startedAt: new Date('2026-01-03T10:00:00Z'),
      completedAt: new Date('2026-01-03T11:00:00Z'),
      status: WorkoutSessionStatus.COMPLETED,
      exercises: [
        {
          id: 'es1',
          exerciseId: 'ex1',
          workoutExerciseId: 'we1',
          order: 0,
          sets: [
            {
              id: 'set1',
              setNumber: 1,
              setType: SetType.NORMAL,
              completed: true,
              actualMetrics: [{ metric: TrackingMetric.WEIGHT, value: 60 }],
            },
          ],
        },
      ],
      createdAt: new Date('2026-01-03T10:00:00Z'),
      updatedAt: new Date('2026-01-03T11:00:00Z'),
    };

    const sRow = sessionToRow(session, 'user-1');
    const back = sessionFromRow(sRow);
    expect(back.workoutId).toBe('w1');
    expect(back.status).toBe(WorkoutSessionStatus.COMPLETED);
    expect(back.exercises).toHaveLength(1);
  });
});
