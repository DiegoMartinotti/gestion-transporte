export interface ExcelUploadZoneProps {
  onUpload: (file: File, data: any[]) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

export interface ExcelDataPreviewProps {
  data: any[];
  rows?: number;
  entityType?: string;
}

export interface ExcelValidationReportProps {
  errors: ImportError[];
  data: any[];
  onCorrect?: (correctedData: any[]) => void;
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}