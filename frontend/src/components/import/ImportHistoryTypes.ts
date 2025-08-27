// Tipos para ImportHistory

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface ImportRecord {
  id: string;
  timestamp: Date;
  entityType: string;
  fileName: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  errors?: ImportError[];
  logs?: ImportLog[];
  fileSize?: number;
}

export interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  averageSuccessRate: number;
  totalRecordsProcessed: number;
  entityCounts: Record<string, number>;
}

export interface ImportHistoryProps {
  onRetryImport?: (importId: string) => void;
  onViewDetails?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
}
