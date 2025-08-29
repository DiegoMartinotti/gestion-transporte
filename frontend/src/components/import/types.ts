export interface ImportError {
  row: number;
  field: string;
  value: string | number | boolean;
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
  data: Record<string, unknown>[];
  validationErrors: ImportError[];
  correctedData: Record<string, unknown>[];
  importResult?: ImportResult;
  isValidating: boolean;
  isImporting: boolean;
}

export interface ImportWizardProps {
  entityType?: string;
  onComplete?: (result: ImportResult) => void;
  onCancel?: () => void;
}

export const ENTITY_TYPES = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'personal', label: 'Personal' },
  { value: 'sites', label: 'Sites' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'tramos', label: 'Tramos' },
  { value: 'viajes', label: 'Viajes' },
  { value: 'extras', label: 'Extras' },
] as const;