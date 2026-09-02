import { SetType } from '../enums/set-type.enum';
import { MetricValue } from './metric-value.interface';

export interface SetTarget {
  id: string;
  setNumber: number;
  targetMetrics: MetricValue[];
  setType: SetType;
}
