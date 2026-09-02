import { Equipment } from '../enums/equipment.enum';
import { MuscleGroup } from '../enums/muscle-group.enum';
import { TrackingMetric } from '../enums/tracking-metric.enum';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroups: MuscleGroup[];
  equipment: Equipment[];
  trackingMetrics: TrackingMetric[];
  instructions?: string[];
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}
