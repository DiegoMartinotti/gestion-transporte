import type { ValidationResult, ExcelRowData } from '../../../types/excel';

export interface ExcelImportModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  entityType: 'cliente' | 'empresa' | 'personal' | 'sites' | 'viajes';
  onImportComplete?: (result: ImportResult) => void;
  processExcelFile: (file: File, options: ImportOptions) => Promise<ImportResult>;
  validateExcelFile: (file: File) => Promise<ValidationFileResult>;
  previewExcelFile: (file: File, sampleSize?: number) => Promise<PreviewResult>;
  getTemplate: () => Promise<void>;
}

export interface ImportOptions {
  autoCorrect?: boolean;
  skipInvalidRows?: boolean;
  batchSize?: number;
  progressCallback?: (progress: ImportProgress) => void;
}

export interface ImportProgress {
  current: number;
  total: number;
  percent: number;
  percentage?: number; // Backwards compatibility
  processed?: number;
}

export interface ImportResult {
  success: boolean;
  summary?: ImportSummary;
  hasMissingData?: boolean;
  importId?: string;
  errors?: ImportError[];
}

export interface ImportSummary {
  totalRows: number;
  insertedRows: number;
  errorRows: number;
  warningRows?: number;
}

export interface ImportError {
  row: number;
  field: string;
  column?: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationFileResult {
  validationResult: ValidationResult;
  processedData: {
    data: ExcelRowData[];
    headers: string[];
  };
}

export interface PreviewResult {
  samples: Array<{
    sample: ExcelRowData[];
    sheetName?: string;
  }>;
  headers: string[];
  totalRows: number;
}

export interface ExcelImportState {
  currentStep: number;
  file: File | null;
  previewData: PreviewResult | null;
  validationResult: ValidationFileResult | null;
  importProgress: number;
  importResult: ImportResult | null;
  loading: boolean;
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  error: string | null;
  correctionUploadModalOpen: boolean;
}

export interface ExcelImportActions {
  setCurrentStep: (step: number) => void;
  setFile: (file: File | null) => void;
  setPreviewData: (data: PreviewResult | null) => void;
  setValidationResult: (result: ValidationFileResult | null) => void;
  setImportProgress: (progress: number) => void;
  setImportResult: (result: ImportResult | null) => void;
  setLoading: (loading: boolean) => void;
  setAutoCorrect: (autoCorrect: boolean) => void;
  setSkipInvalidRows: (skipInvalidRows: boolean) => void;
  setError: (error: string | null) => void;
  setCorrectionUploadModalOpen: (open: boolean) => void;
  resetState: () => void;
  resetImportForm: () => void;
  handleFileUpload: (
    file: File,
    abortController: React.MutableRefObject<AbortController | null>
  ) => Promise<void>;
  handleValidationReview: () => void;
  handleImport: (
    file: File | null,
    abortController: React.MutableRefObject<AbortController | null>
  ) => Promise<void>;
  handleRetryImport: (
    file: File | null,
    abortController: React.MutableRefObject<AbortController | null>
  ) => Promise<void>;
  handleTemplateDownload: () => Promise<void>;
  handleDownloadMissingDataTemplates: () => Promise<void>;
  handleCorrectionUploadSuccess: (
    result?: unknown,
    onImportComplete?: (result: ImportResult) => void
  ) => void;
}

export interface ExcelImportActionsConfig {
  state: ExcelImportState & {
    setCurrentStep: (step: number) => void;
    setFile: (file: File | null) => void;
    setPreviewData: (data: PreviewResult | null) => void;
    setValidationResult: (result: ValidationFileResult | null) => void;
    setImportProgress: (progress: number) => void;
    setImportResult: (result: ImportResult | null) => void;
    setLoading: (loading: boolean) => void;
    setAutoCorrect: (autoCorrect: boolean) => void;
    setSkipInvalidRows: (skipInvalidRows: boolean) => void;
    setError: (error: string | null) => void;
    setCorrectionUploadModalOpen: (open: boolean) => void;
    resetState: () => void;
    resetImportForm: () => void;
  };
  processExcelFile: (file: File, options: ImportOptions) => Promise<ImportResult>;
  validateExcelFile: (file: File) => Promise<ValidationFileResult>;
  previewExcelFile: (file: File, sampleSize?: number) => Promise<PreviewResult>;
  getTemplate: () => Promise<void>;
  onImportComplete?: (result: ImportResult) => void;
}
