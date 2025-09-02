export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  description?: string;
  example?: string;
  validation?: string;
}

export interface TemplateConfig {
  entityType: string;
  entityName: string;
  fields: FieldConfig[];
  includeExamples: boolean;
  includeValidation: boolean;
  includeInstructions: boolean;
  includeReferenceData: boolean;
}
