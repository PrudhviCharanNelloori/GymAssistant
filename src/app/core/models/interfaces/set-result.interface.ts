import { SetType } from '../enums/set-type.enum';
import { MetricValue } from './metric-value.interface';

export interface SetResult {
  id: string;
  setNumber: number;
  setType: SetType;
  actualMetrics: MetricValue[];
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
}
