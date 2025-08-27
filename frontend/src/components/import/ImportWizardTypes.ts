// Tipos para ImportWizard

export interface ImportError {
  row: number;
  field: string;
  value: unknown;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  entityType: string;
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
  timestamp: Date;
}

export interface ImportState {
  file?: File;
  data: Array<Record<string, unknown>>;
  validationErrors: ImportError[];
  correctedData: Array<Record<string, unknown>>;
  importResult?: ImportResult;
  isValidating: boolean;
  isImporting: boolean;
}

export interface ImportWizardProps {
  entityType?: string;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

export interface EntityType {
  value: string;
  label: string;
  description: string;
  icon: string;
}
