import { Equipment } from '../enums/equipment.enum';
import { MuscleGroup } from '../enums/muscle-group.enum';
import { TrackingMetric } from '../enums/tracking-metric.enum';
import type { Syncable } from './sync.interface';

export interface Exercise extends Syncable {
  id: string;
  name: string;
  description?: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroups: MuscleGroup[];
  equipment: Equipment[];
  trackingMetrics: TrackingMetric[];
  instructions?: string[];
  /** Optional external form guide (usually YouTube). Not bundled media. */
  videoUrl?: string;
  /** In-app illustration path (e.g. RepDB WebP under /assets/exercises/). */
  imageUrl?: string;
  /** Optional start-pose illustration. */
  imageStartUrl?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}
