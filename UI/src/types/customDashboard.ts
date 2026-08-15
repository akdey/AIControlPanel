export type WidgetType = 'time_series' | 'bar_gauge' | 'stat_metric' | 'pie_chart' | 'logs_table';
export type WidgetSize = '1x1' | '2x1' | '3x1' | '2x2';

export interface DataPoint {
  time: string;
  value: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  metricSource: string;
  size: WidgetSize;
  unit: string;
  currentValue?: string;
  dataPoints: DataPoint[];
}

export interface CustomDashboardItem {
  id: string;
  title: string;
  category: string;
  createdBy: string;
  updatedAt: string;
  widgets: DashboardWidget[];
}
