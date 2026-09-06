import type {
  Exercise,
  Workout,
  WorkoutProgram,
  WorkoutSession,
} from '../models';

export function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function fromIso(value?: string | null): Date | undefined {
  if (!value) return undefined;
  return new Date(value);
}

export function exerciseToRow(exercise: Exercise, userId: string) {
  return {
    id: exercise.id,
    user_id: exercise.isCustom ? userId : (exercise.userId ?? userId),
    name: exercise.name,
    description: exercise.description ?? null,
    primary_muscle_group: exercise.primaryMuscleGroup,
    secondary_muscle_groups: exercise.secondaryMuscleGroups,
    equipment: exercise.equipment,
    tracking_metrics: exercise.trackingMetrics,
    instructions: exercise.instructions ?? [],
    video_url: exercise.videoUrl ?? null,
    image_url: exercise.imageUrl ?? null,
    image_start_url: exercise.imageStartUrl ?? null,
    is_custom: exercise.isCustom,
    created_at: toIso(exercise.createdAt) ?? new Date().toISOString(),
    updated_at: toIso(exercise.updatedAt) ?? new Date().toISOString(),
    deleted_at: toIso(exercise.deletedAt ?? null),
  };
}

export function exerciseFromRow(row: Record<string, unknown>): Exercise {
  return {
    id: String(row['id']),
    userId: (row['user_id'] as string | null) ?? undefined,
    name: String(row['name']),
    description: (row['description'] as string | null) ?? undefined,
    primaryMuscleGroup: row['primary_muscle_group'] as Exercise['primaryMuscleGroup'],
    secondaryMuscleGroups: (row['secondary_muscle_groups'] as Exercise['secondaryMuscleGroups']) ?? [],
    equipment: (row['equipment'] as Exercise['equipment']) ?? [],
    trackingMetrics: (row['tracking_metrics'] as Exercise['trackingMetrics']) ?? [],
    instructions: (row['instructions'] as string[] | null) ?? undefined,
    videoUrl: (row['video_url'] as string | null) ?? undefined,
    imageUrl: (row['image_url'] as string | null) ?? undefined,
    imageStartUrl: (row['image_start_url'] as string | null) ?? undefined,
    isCustom: Boolean(row['is_custom']),
    createdAt: fromIso(row['created_at'] as string) ?? new Date(),
    updatedAt: fromIso(row['updated_at'] as string) ?? new Date(),
    deletedAt: fromIso(row['deleted_at'] as string | null) ?? null,
    dirty: false,
    syncStatus: 'synced',
  };
}

export function workoutToRow(workout: Workout, userId: string) {
  return {
    id: workout.id,
    user_id: userId,
    name: workout.name,
    description: workout.description ?? null,
    exercises: workout.exercises,
    created_at: toIso(workout.createdAt) ?? new Date().toISOString(),
    updated_at: toIso(workout.updatedAt) ?? new Date().toISOString(),
    deleted_at: toIso(workout.deletedAt ?? null),
  };
}

export function workoutFromRow(row: Record<string, unknown>): Workout {
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    name: String(row['name']),
    description: (row['description'] as string | null) ?? undefined,
    exercises: (row['exercises'] as Workout['exercises']) ?? [],
    createdAt: fromIso(row['created_at'] as string) ?? new Date(),
    updatedAt: fromIso(row['updated_at'] as string) ?? new Date(),
    deletedAt: fromIso(row['deleted_at'] as string | null) ?? null,
    dirty: false,
    syncStatus: 'synced',
  };
}

export function programToRow(program: WorkoutProgram, userId: string) {
  return {
    id: program.id,
    user_id: userId,
    name: program.name,
    description: program.description ?? null,
    schedule: program.schedule,
    is_active: program.isActive,
    created_at: toIso(program.createdAt) ?? new Date().toISOString(),
    updated_at: toIso(program.updatedAt) ?? new Date().toISOString(),
    deleted_at: toIso(program.deletedAt ?? null),
  };
}

export function programFromRow(row: Record<string, unknown>): WorkoutProgram {
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    name: String(row['name']),
    description: (row['description'] as string | null) ?? undefined,
    schedule: (row['schedule'] as WorkoutProgram['schedule']) ?? [],
    isActive: Boolean(row['is_active']),
    createdAt: fromIso(row['created_at'] as string) ?? new Date(),
    updatedAt: fromIso(row['updated_at'] as string) ?? new Date(),
    deletedAt: fromIso(row['deleted_at'] as string | null) ?? null,
    dirty: false,
    syncStatus: 'synced',
  };
}

export function sessionToRow(session: WorkoutSession, userId: string) {
  const now = new Date().toISOString();
  return {
    id: session.id,
    user_id: userId,
    workout_id: session.workoutId,
    program_id: session.programId ?? null,
    started_at: toIso(session.startedAt) ?? now,
    completed_at: toIso(session.completedAt ?? null),
    status: session.status,
    exercises: session.exercises,
    notes: session.notes ?? null,
    created_at: toIso(session.createdAt) ?? toIso(session.startedAt) ?? now,
    updated_at: toIso(session.updatedAt) ?? now,
    deleted_at: toIso(session.deletedAt ?? null),
  };
}

export function sessionFromRow(row: Record<string, unknown>): WorkoutSession {
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    workoutId: String(row['workout_id']),
    programId: (row['program_id'] as string | null) ?? undefined,
    startedAt: fromIso(row['started_at'] as string) ?? new Date(),
    completedAt: fromIso(row['completed_at'] as string | null),
    status: row['status'] as WorkoutSession['status'],
    exercises: (row['exercises'] as WorkoutSession['exercises']) ?? [],
    notes: (row['notes'] as string | null) ?? undefined,
    createdAt: fromIso(row['created_at'] as string),
    updatedAt: fromIso(row['updated_at'] as string),
    deletedAt: fromIso(row['deleted_at'] as string | null) ?? null,
    dirty: false,
    syncStatus: 'synced',
  };
}
