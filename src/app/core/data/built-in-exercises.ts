import {
  Equipment,
  MuscleGroup,
  TrackingMetric,
} from '../models';
import type { CreateExerciseInput } from '../storage';

const WEIGHT_REPS = [TrackingMetric.WEIGHT, TrackingMetric.REPS];
const REPS_ONLY = [TrackingMetric.REPS];
const DURATION = [TrackingMetric.DURATION];

type SeedExercise = Omit<CreateExerciseInput, 'isCustom'> & { id: string };

/**
 * Built-in exercise catalog. Stable IDs keep seeds idempotent across launches.
 */
export const BUILT_IN_EXERCISES: SeedExercise[] = [
  // Chest
  {
    id: 'builtin-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscleGroup: MuscleGroup.CHEST,
    secondaryMuscleGroups: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
    description: 'Flat bench compound press for chest strength.',
    instructions: [
      'Lie on a flat bench with feet planted.',
      'Unrack the bar over mid-chest.',
      'Lower with control, then press up.',
    ],
  },
  {
    id: 'builtin-incline-db-press',
    name: 'Incline Dumbbell Press',
    primaryMuscleGroup: MuscleGroup.CHEST,
    secondaryMuscleGroups: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS],
    equipment: [Equipment.DUMBBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-cable-fly',
    name: 'Cable Chest Fly',
    primaryMuscleGroup: MuscleGroup.CHEST,
    secondaryMuscleGroups: [],
    equipment: [Equipment.CABLE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-push-up',
    name: 'Push Up',
    primaryMuscleGroup: MuscleGroup.CHEST,
    secondaryMuscleGroups: [MuscleGroup.TRICEPS, MuscleGroup.CORE],
    equipment: [Equipment.BODYWEIGHT],
    trackingMetrics: REPS_ONLY,
  },

  // Back
  {
    id: 'builtin-deadlift',
    name: 'Conventional Deadlift',
    primaryMuscleGroup: MuscleGroup.BACK,
    secondaryMuscleGroups: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES, MuscleGroup.CORE],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
    description: 'Hip hinge pull from the floor.',
  },
  {
    id: 'builtin-barbell-row',
    name: 'Barbell Row',
    primaryMuscleGroup: MuscleGroup.BACK,
    secondaryMuscleGroups: [MuscleGroup.BICEPS],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscleGroup: MuscleGroup.BACK,
    secondaryMuscleGroups: [MuscleGroup.BICEPS],
    equipment: [Equipment.CABLE, Equipment.MACHINE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-pull-up',
    name: 'Pull Up',
    primaryMuscleGroup: MuscleGroup.BACK,
    secondaryMuscleGroups: [MuscleGroup.BICEPS],
    equipment: [Equipment.BODYWEIGHT],
    trackingMetrics: REPS_ONLY,
  },
  {
    id: 'builtin-seated-row',
    name: 'Seated Cable Row',
    primaryMuscleGroup: MuscleGroup.BACK,
    secondaryMuscleGroups: [MuscleGroup.BICEPS],
    equipment: [Equipment.CABLE],
    trackingMetrics: WEIGHT_REPS,
  },

  // Shoulders
  {
    id: 'builtin-ohp',
    name: 'Overhead Press',
    primaryMuscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscleGroups: [MuscleGroup.TRICEPS, MuscleGroup.CORE],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscleGroups: [],
    equipment: [Equipment.DUMBBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-face-pull',
    name: 'Face Pull',
    primaryMuscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscleGroups: [MuscleGroup.BACK],
    equipment: [Equipment.CABLE],
    trackingMetrics: WEIGHT_REPS,
  },

  // Arms
  {
    id: 'builtin-barbell-curl',
    name: 'Barbell Curl',
    primaryMuscleGroup: MuscleGroup.BICEPS,
    secondaryMuscleGroups: [MuscleGroup.FOREARMS],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-hammer-curl',
    name: 'Hammer Curl',
    primaryMuscleGroup: MuscleGroup.BICEPS,
    secondaryMuscleGroups: [MuscleGroup.FOREARMS],
    equipment: [Equipment.DUMBBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-tricep-pushdown',
    name: 'Tricep Pushdown',
    primaryMuscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscleGroups: [],
    equipment: [Equipment.CABLE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-skull-crusher',
    name: 'Skull Crusher',
    primaryMuscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscleGroups: [],
    equipment: [Equipment.BARBELL, Equipment.DUMBBELL],
    trackingMetrics: WEIGHT_REPS,
  },

  // Legs
  {
    id: 'builtin-back-squat',
    name: 'Back Squat',
    primaryMuscleGroup: MuscleGroup.QUADS,
    secondaryMuscleGroups: [MuscleGroup.GLUTES, MuscleGroup.CORE],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
    description: 'Primary lower-body compound squat.',
  },
  {
    id: 'builtin-rdl',
    name: 'Romanian Deadlift',
    primaryMuscleGroup: MuscleGroup.HAMSTRINGS,
    secondaryMuscleGroups: [MuscleGroup.GLUTES, MuscleGroup.BACK],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-leg-press',
    name: 'Leg Press',
    primaryMuscleGroup: MuscleGroup.QUADS,
    secondaryMuscleGroups: [MuscleGroup.GLUTES],
    equipment: [Equipment.MACHINE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-walking-lunge',
    name: 'Walking Lunge',
    primaryMuscleGroup: MuscleGroup.QUADS,
    secondaryMuscleGroups: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS],
    equipment: [Equipment.DUMBBELL, Equipment.BODYWEIGHT],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-leg-curl',
    name: 'Lying Leg Curl',
    primaryMuscleGroup: MuscleGroup.HAMSTRINGS,
    secondaryMuscleGroups: [],
    equipment: [Equipment.MACHINE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-leg-extension',
    name: 'Leg Extension',
    primaryMuscleGroup: MuscleGroup.QUADS,
    secondaryMuscleGroups: [],
    equipment: [Equipment.MACHINE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-hip-thrust',
    name: 'Hip Thrust',
    primaryMuscleGroup: MuscleGroup.GLUTES,
    secondaryMuscleGroups: [MuscleGroup.HAMSTRINGS],
    equipment: [Equipment.BARBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscleGroup: MuscleGroup.CALVES,
    secondaryMuscleGroups: [],
    equipment: [Equipment.MACHINE, Equipment.BODYWEIGHT],
    trackingMetrics: WEIGHT_REPS,
  },

  // Core & conditioning
  {
    id: 'builtin-plank',
    name: 'Plank',
    primaryMuscleGroup: MuscleGroup.CORE,
    secondaryMuscleGroups: [],
    equipment: [Equipment.BODYWEIGHT],
    trackingMetrics: DURATION,
  },
  {
    id: 'builtin-hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscleGroup: MuscleGroup.CORE,
    secondaryMuscleGroups: [],
    equipment: [Equipment.BODYWEIGHT],
    trackingMetrics: REPS_ONLY,
  },
  {
    id: 'builtin-cable-crunch',
    name: 'Cable Crunch',
    primaryMuscleGroup: MuscleGroup.CORE,
    secondaryMuscleGroups: [],
    equipment: [Equipment.CABLE],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-kb-swing',
    name: 'Kettlebell Swing',
    primaryMuscleGroup: MuscleGroup.FULL_BODY,
    secondaryMuscleGroups: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.CORE],
    equipment: [Equipment.KETTLEBELL],
    trackingMetrics: WEIGHT_REPS,
  },
  {
    id: 'builtin-band-pull-apart',
    name: 'Band Pull-Apart',
    primaryMuscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscleGroups: [MuscleGroup.BACK],
    equipment: [Equipment.BAND],
    trackingMetrics: REPS_ONLY,
  },
];

export function toBuiltInExerciseInputs(): CreateExerciseInput[] {
  return BUILT_IN_EXERCISES.map((exercise) => ({
    ...exercise,
    isCustom: false,
  }));
}

export function isBuiltInExercise(exercise: { id: string; isCustom: boolean }): boolean {
  return !exercise.isCustom || exercise.id.startsWith('builtin-');
}
