// Types for the Reports System
export type ReportType =
  | 'financial'
  | 'operations'
  | 'vehicle'
  | 'client'
  | 'partidas'
  | 'trips'
  | 'routes'
  | 'custom';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'scatter' | 'composed';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'image';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export type AggregationFunction =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'median'
  | 'distinct_count';

export type DateRange =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReportExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Core Data Types
export interface ReportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  description?: string;
  required?: boolean;
  format?: string;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  values?: any[];
  label?: string;
  group?: string;
}

export interface ReportGroupBy {
  field: string;
  label: string;
  dateFormat?: string; // For date fields: 'day', 'week', 'month', 'year'
}

export interface ReportAggregation {
  field: string;
  function: AggregationFunction;
  label: string;
  format?: string;
}

export interface ReportSorting {
  field: string;
  direction: 'asc' | 'desc';
}

// Chart Configuration
export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string[];
  colors?: string[];
  dataKey?: string;
  nameKey?: string;
  valueKey?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  stacked?: boolean;
  smooth?: boolean;
}

// Export Configuration
export interface ExportConfig {
  format: ExportFormat;
  fileName?: string;
  title?: string;
  includeCharts?: boolean;
  includeTable?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter' | 'legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Report Definition
export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  dataSource: string;
  fields: ReportField[];
  filters: ReportFilter[];
  groupBy?: ReportGroupBy[];
  aggregations?: ReportAggregation[];
  sorting?: ReportSorting[];
  charts?: ChartConfig[];
  defaultDateRange?: DateRange;
  customDateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
  dateRange?: string;
  pageSize?: number;
  exportFormats?: string[];
  schedule?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isTemplate?: boolean;
  tags?: string[];
}

// Report Data
export interface ReportData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  aggregatedData?: Record<string, any>;
  chartData?: any[];
  metadata?: {
    executionTime: number;
    generatedAt: Date;
    filters: ReportFilter[];
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
}

// Scheduled Report
export interface ScheduledReport {
  id: string;
  reportDefinitionId: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  scheduleConfig: {
    time: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    timezone: string;
  };
  recipients: string[];
  exportFormats: ExportFormat[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
  createdBy: string;
}

// Report Execution
export interface ReportExecution {
  id: string;
  reportDefinitionId: string;
  scheduledReportId?: string;
  status: ReportExecutionStatus;
  format: ExportFormat;
  startTime: string;
  endTime?: string;
  createdBy: string;
  recordsProcessed?: number;
  outputFile?: {
    name: string;
    size: number;
    url?: string;
  };
  error?: string;
  parameters?: Record<string, any>;
  isScheduled?: boolean;
  // Additional properties for backward compatibility
  reportName: string;
  createdAt: string;
  reportId?: string; // alias for reportDefinitionId
  description?: string;
}

// Report History (for backward compatibility)
export interface ReportHistory {
  id: string;
  reportDefinitionId: string;
  scheduledReportId?: string;
  reportName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executionTime?: number;
  recordCount?: number;
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  generatedAt: Date;
  generatedBy: string;
  expiresAt?: Date;
  exportConfig: ExportConfig;
}

// Report Builder State
export interface ReportBuilderState {
  definition: Partial<ReportDefinition>;
  previewData?: ReportData;
  isPreviewLoading: boolean;
  selectedFields: string[];
  availableFields: ReportField[];
  errors: Record<string, string>;
  isDirty: boolean;
}

// Data Source Configuration
export interface DataSource {
  key: string;
  name: string;
  description: string;
  table: string;
  fields: ReportField[];
  defaultFilters?: ReportFilter[];
  relationships?: DataSourceRelationship[];
}

export interface DataSourceRelationship {
  table: string;
  localKey: string;
  foreignKey: string;
  type: 'hasMany' | 'belongsTo' | 'hasOne';
}

// Pre-defined Report Templates
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ReportType;
  definition: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  preview?: string; // Base64 image or URL
  tags: string[];
  isPopular?: boolean;
}

// Filter Options for UI
export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

// Dashboard Widget Configuration
export interface ReportWidget {
  id: string;
  title: string;
  reportDefinitionId: string;
  chartConfig: ChartConfig;
  refreshInterval?: number; // minutes
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
}

// API Responses
export interface ReportApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedReportResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Report Permission System
export interface ReportPermission {
  reportId: string;
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  canExport: boolean;
  canSchedule: boolean;
  canShare: boolean;
}

// Quick Filter Presets
export interface QuickFilter {
  id: string;
  name: string;
  description: string;
  filters: ReportFilter[];
  icon?: string;
  category?: string;
}
