// Tipos y interfaces para CrossEntityValidator

export interface CrossEntityRuleConfig {
  id: string;
  name: string;
  description: string;
  entityType: string;
  dependencies: string[];
  severity: 'error' | 'warning' | 'info';
}

export interface EntityRecord {
  id?: string;
  _id?: string;
  [key: string]: unknown;
}

export interface EntityData {
  [entityType: string]: EntityRecord[];
}

export interface ValidationDetail {
  record: EntityRecord;
  issue: string;
}

export interface VehicleRecord {
  vehiculoId: string;
  [key: string]: unknown;
}

export interface ValidationContext {
  passed: boolean;
  affectedRecords: number;
  details: ValidationDetail[];
}

export interface CrossEntityValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  affectedRecords: number;
  details?: ValidationDetail[];
}

export interface CrossEntityValidatorProps {
  data: EntityData;
  rules?: CrossEntityRuleConfig[];
  onValidationComplete?: (results: CrossEntityValidationResult[]) => void;
  autoValidate?: boolean;
}
