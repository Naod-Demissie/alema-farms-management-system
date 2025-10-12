// Reports and analytics types

import { FilterParams, DateRange } from "@/lib/types";

// Analytics Types
export interface AnalyticsFilters extends FilterParams {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  metrics?: string[];
}

export interface ReportFilters extends FilterParams {
  format?: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
}

// Re-export DateRange for convenience
export type { DateRange };

