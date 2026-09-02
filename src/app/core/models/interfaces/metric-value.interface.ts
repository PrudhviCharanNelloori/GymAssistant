import { TrackingMetric } from '../enums/tracking-metric.enum';

export interface MetricValue {
  metric: TrackingMetric;
  value: number;
  unit?: string;
}
