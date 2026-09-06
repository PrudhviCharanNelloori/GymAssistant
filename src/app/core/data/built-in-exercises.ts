import type {
  Equipment,
  MuscleGroup,
  TrackingMetric,
} from '../models';
import type { CreateExerciseInput } from '../storage';
import catalog from './exercises-catalog.json';

type CatalogRow = {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: string[];
  trackingMetrics: string[];
  instructions?: string[];
  description?: string;
  imageUrl?: string;
  imageStartUrl?: string;
  videoUrl?: string;
  source?: string;
};

export type BuiltInExerciseSeed = Omit<CreateExerciseInput, 'isCustom'> & {
  id: string;
};

/**
 * Curated RepDB free-tier subset (in-app use with attribution).
 * See docs/THIRD-PARTY-NOTICES.md — do not redistribute as a dataset.
 */
export const BUILT_IN_EXERCISES: BuiltInExerciseSeed[] = (catalog as CatalogRow[]).map((row) => ({
  id: row.id,
  name: row.name,
  primaryMuscleGroup: row.primaryMuscleGroup as MuscleGroup,
  secondaryMuscleGroups: row.secondaryMuscleGroups as MuscleGroup[],
  equipment: row.equipment as Equipment[],
  trackingMetrics: row.trackingMetrics as TrackingMetric[],
  instructions: row.instructions,
  description: row.description,
  imageUrl: row.imageUrl,
  imageStartUrl: row.imageStartUrl,
  videoUrl: row.videoUrl,
}));

export const BUILT_IN_EXERCISE_IDS = new Set(BUILT_IN_EXERCISES.map((e) => e.id));

export const BUILT_IN_CATALOG_VERSION = 4;

export function toBuiltInExerciseInputs(): CreateExerciseInput[] {
  return BUILT_IN_EXERCISES.map((exercise) => ({
    ...exercise,
    isCustom: false,
  }));
}

export function isBuiltInExercise(exercise: { id: string; isCustom: boolean }): boolean {
  return (
    !exercise.isCustom ||
    exercise.id.startsWith('repdb-') ||
    exercise.id.startsWith('builtin-') ||
    exercise.id.startsWith('exdb-')
  );
}
