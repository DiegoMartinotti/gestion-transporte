export interface ExcelUploadZoneProps {
  onUpload: (file: File, data: Record<string, unknown>[]) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

export interface ExcelDataPreviewProps {
  data: Record<string, unknown>[];
  rows?: number;
  entityType?: string;
}

export interface ExcelValidationReportProps {
  errors: ImportError[];
  data: Record<string, unknown>[];
  onCorrect?: (correctedData: Record<string, unknown>[]) => void;
}

export interface ImportError {
  row: number;
  field: string;
  value: string | number | boolean | null | undefined;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}
