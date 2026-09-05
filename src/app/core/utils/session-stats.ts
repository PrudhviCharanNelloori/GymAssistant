import { TrackingMetric, type ExerciseSession, type SetResult, type WorkoutSession } from '../models';

export type SessionStats = {
  durationMinutes: number;
  completedSets: number;
  totalSets: number;
  volumeKg: number;
  completionRate: number;
  exerciseCount: number;
};

export function sessionDurationMinutes(session: WorkoutSession): number {
  const started = new Date(session.startedAt).getTime();
  const ended = new Date(session.completedAt ?? session.startedAt).getTime();
  return Math.max(1, Math.round((ended - started) / 60000));
}

export function summarizeSession(session: WorkoutSession): SessionStats {
  let completedSets = 0;
  let totalSets = 0;
  let volumeKg = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      if (!set.completed) continue;
      completedSets += 1;
      volumeKg += setVolumeKg(set);
    }
  }

  return {
    durationMinutes: sessionDurationMinutes(session),
    completedSets,
    totalSets,
    volumeKg: Math.round(volumeKg),
    completionRate: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100),
    exerciseCount: session.exercises.length,
  };
}

export function setVolumeKg(set: SetResult): number {
  const weight =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.WEIGHT)?.value ?? 0;
  const reps =
    set.actualMetrics.find((metric) => metric.metric === TrackingMetric.REPS)?.value ?? 0;
  return weight * reps;
}

export function formatSetResult(set: SetResult): string {
  const weight = set.actualMetrics.find((metric) => metric.metric === TrackingMetric.WEIGHT)?.value;
  const reps = set.actualMetrics.find((metric) => metric.metric === TrackingMetric.REPS)?.value;
  const duration = set.actualMetrics.find(
    (metric) =>
      metric.metric === TrackingMetric.DURATION || metric.metric === TrackingMetric.TIME,
  )?.value;

  if (weight !== undefined && reps !== undefined) {
    return `${weight} kg × ${reps}`;
  }
  if (reps !== undefined) {
    return `${reps} reps`;
  }
  if (duration !== undefined) {
    return `${duration}s`;
  }
  return set.completed ? 'Completed' : 'Skipped';
}

export function formatExerciseSessionSummary(exercise: ExerciseSession): string {
  const completed = exercise.sets.filter((set) => set.completed);
  if (completed.length === 0) {
    return 'No sets logged';
  }
  return completed.map((set) => formatSetResult(set)).join(' · ');
}

export function formatSessionDate(session: WorkoutSession): string {
  const date = new Date(session.completedAt ?? session.startedAt);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSessionDateTime(session: WorkoutSession): string {
  const date = new Date(session.completedAt ?? session.startedAt);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
