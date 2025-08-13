export interface ImportResult {
  entityType: string;
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
  timestamp: Date;
}

export interface ImportError {
  row: number;
  field: string;
  value: unknown;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportState {
  file?: File;
  data: unknown[];
  validationErrors: ImportError[];
  correctedData: unknown[];
  importResult?: ImportResult;
  isValidating: boolean;
  isImporting: boolean;
}
