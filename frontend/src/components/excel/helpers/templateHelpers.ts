import * as XLSX from 'xlsx';
import { TemplateConfig, FieldConfig } from '../types/ExcelTemplateTypes';

export const createTemplateSheet = (config: TemplateConfig, selectedFields: string[]) => {
  const selectedFieldConfigs = config.fields.filter((f: FieldConfig) =>
    selectedFields.includes(f.key)
  );

  const headers = selectedFieldConfigs.map((f: FieldConfig) => f.label);
  const examples = config.includeExamples
    ? selectedFieldConfigs.map((f: FieldConfig) => f.example || '')
    : [];

  const data = [headers];
  if (examples.length > 0) {
    data.push(examples);
  }

  return data;
};

export const createInstructionsSheet = (config: TemplateConfig, selectedFields: string[]) => {
  const instructions = [
    ['INSTRUCCIONES PARA IMPORTACIÓN DE ' + config.entityName.toUpperCase()],
    [''],
    ['1. Campos Obligatorios (marcados con *):'],
    ...config.fields
      .filter((f: FieldConfig) => f.required && selectedFields.includes(f.key))
      .map((f: FieldConfig) => [`   - ${f.label}: ${f.description || ''}`]),
    [''],
    ['2. Campos Opcionales:'],
    ...config.fields
      .filter((f: FieldConfig) => !f.required && selectedFields.includes(f.key))
      .map((f: FieldConfig) => [`   - ${f.label}: ${f.description || ''}`]),
    [''],
    ['3. Validaciones:'],
    ...config.fields
      .filter((f: FieldConfig) => f.validation && selectedFields.includes(f.key))
      .map((f: FieldConfig) => [`   - ${f.label}: ${f.validation}`]),
    [''],
    ['4. Formato del archivo:'],
    ['   - Usar solo la hoja "Plantilla"'],
    ['   - No modificar los nombres de las columnas'],
    ['   - Los campos obligatorios no pueden estar vacíos'],
    ['   - Eliminar las filas de ejemplo antes de importar'],
    [''],
    ['5. Proceso de importación:'],
    ['   - Completar todos los datos en la hoja "Plantilla"'],
    ['   - Guardar el archivo en formato Excel (.xlsx)'],
    ['   - Subir el archivo usando el sistema de importación'],
  ];

  return XLSX.utils.aoa_to_sheet(instructions);
};

export const createReferenceSheet = (entityType: string, data: unknown[]) => {
  if (data.length === 0) return XLSX.utils.aoa_to_sheet([['Sin datos']]);

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map((item) =>
    headers.map((header) => (item as Record<string, unknown>)[header] || '')
  );

  return XLSX.utils.aoa_to_sheet([headers, ...rows]);
};

export const applySheetFormatting = (sheet: XLSX.WorkSheet) => {
  // Aplicar formato básico (esto es limitado en SheetJS sin la versión pro)
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

  // Establecer anchos de columna
  const colWidths = [];
  for (let i = 0; i <= range.e.c; i++) {
    colWidths.push({ width: 20 });
  }
  sheet['!cols'] = colWidths;
};
