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

import { PreviewData } from '../excel/ExcelDataPreview';

export interface ImportState {
  file?: File;
  data: PreviewData[];
  validationErrors: ImportError[];
  correctedData: PreviewData[];
  importResult?: ImportResult;
  isValidating: boolean;
  isImporting: boolean;
}
