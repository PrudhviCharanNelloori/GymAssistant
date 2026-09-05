import {
  SetType,
  TrackingMetric,
  type Exercise,
  type SetTarget,
  type WorkoutExercise,
} from '../models';
import { createId } from './id';

export function defaultMetricValue(metric: TrackingMetric): number {
  switch (metric) {
    case TrackingMetric.WEIGHT:
    case TrackingMetric.ASSISTANCE_WEIGHT:
      return 20;
    case TrackingMetric.REPS:
      return 10;
    case TrackingMetric.DURATION:
    case TrackingMetric.TIME:
      return 60;
    case TrackingMetric.DISTANCE:
      return 1;
    case TrackingMetric.RPE:
      return 7;
    case TrackingMetric.BODY_WEIGHT:
      return 1;
    case TrackingMetric.CALORIES:
      return 100;
    default:
      return 0;
  }
}

export function defaultMetricUnit(metric: TrackingMetric): string | undefined {
  switch (metric) {
    case TrackingMetric.WEIGHT:
    case TrackingMetric.ASSISTANCE_WEIGHT:
      return 'kg';
    case TrackingMetric.DURATION:
    case TrackingMetric.TIME:
      return 'sec';
    case TrackingMetric.DISTANCE:
      return 'km';
    default:
      return undefined;
  }
}

export function createDefaultSetTargets(
  exercise: Pick<Exercise, 'trackingMetrics'>,
  setCount = 3,
): SetTarget[] {
  const metrics =
    exercise.trackingMetrics.length > 0
      ? exercise.trackingMetrics
      : [TrackingMetric.WEIGHT, TrackingMetric.REPS];

  return Array.from({ length: setCount }, (_, index) => ({
    id: createId(),
    setNumber: index + 1,
    setType: SetType.NORMAL,
    targetMetrics: metrics.map((metric) => ({
      metric,
      value: defaultMetricValue(metric),
      unit: defaultMetricUnit(metric),
    })),
  }));
}

export function createWorkoutExercise(
  exercise: Pick<Exercise, 'id' | 'trackingMetrics'>,
  order: number,
  options?: { setCount?: number; restSeconds?: number },
): WorkoutExercise {
  return {
    id: createId(),
    exerciseId: exercise.id,
    order,
    sets: createDefaultSetTargets(exercise, options?.setCount ?? 3),
    restSeconds: options?.restSeconds ?? 90,
  };
}

export function summarizeSets(sets: SetTarget[]): string {
  if (sets.length === 0) {
    return 'No sets';
  }

  const reps = sets[0]?.targetMetrics.find((m) => m.metric === TrackingMetric.REPS)?.value;
  const weight = sets[0]?.targetMetrics.find((m) => m.metric === TrackingMetric.WEIGHT)?.value;
  const duration = sets[0]?.targetMetrics.find(
    (m) => m.metric === TrackingMetric.DURATION || m.metric === TrackingMetric.TIME,
  )?.value;

  const setLabel = `${sets.length} set${sets.length === 1 ? '' : 's'}`;

  if (reps !== undefined && weight !== undefined) {
    return `${setLabel} · ${weight} kg × ${reps}`;
  }
  if (reps !== undefined) {
    return `${setLabel} · ${reps} reps`;
  }
  if (duration !== undefined) {
    return `${setLabel} · ${duration}s`;
  }
  return setLabel;
}

export function summarizeWorkoutExercise(item: WorkoutExercise): string {
  const base = summarizeSets(item.sets);
  if (!item.restSeconds) {
    return base;
  }
  return `${base} · ${item.restSeconds}s rest`;
}

export function estimateWorkoutMinutes(exercises: WorkoutExercise[]): number {
  if (exercises.length === 0) {
    return 0;
  }

  const setSeconds = exercises.reduce((total, item) => {
    const work = item.sets.length * 45;
    const rest = (item.sets.length - 1) * (item.restSeconds ?? 90);
    return total + work + Math.max(rest, 0);
  }, 0);

  return Math.max(5, Math.round(setSeconds / 60));
}
