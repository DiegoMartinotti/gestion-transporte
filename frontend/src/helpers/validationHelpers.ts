import { ValidationError, ExcelRowData, ExcelCellValue } from '../types/excel';

/**
 * Valida formato de CUIT
 */
export function validateCuitFormat(value: string): boolean {
  const cuitRegex = /^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/;
  return cuitRegex.test(value.trim());
}

/**
 * Valida formato de email
 */
export function validateEmailFormat(value: string): boolean {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.[a-zA-Z]{2,3})+$/;
  return emailRegex.test(value.trim());
}

/**
 * Valida formato de DNI
 */
export function validateDniFormat(value: string): boolean {
  const dniRegex = /^[0-9]{7,8}$/;
  return dniRegex.test(value.trim());
}

/**
 * Valida formato de CUIL
 */
export function validateCuilFormat(value: string): boolean {
  const cuilRegex = /^[0-9]{2}-[0-9]{8}-[0-9]$/;
  return cuilRegex.test(value.trim());
}

/**
 * Valida si un valor está vacío
 */
export function isEmpty(value: ExcelCellValue): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * Sugiere formato correcto para CUIT
 */
export function formatCuitSuggestion(value: string): string | undefined {
  if (value.length >= 8) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
    }
  }
  return undefined;
}

/**
 * Sugiere formato correcto para email
 */
export function formatEmailSuggestion(value: string): string | undefined {
  if (!value.includes('@')) {
    return 'Debe incluir @ y un dominio válido';
  }
  return undefined;
}

/**
 * Encuentra coincidencia más cercana en una lista
 */
export function findClosestMatch(value: string, options: string[]): string | undefined {
  const lowerValue = value.toLowerCase();
  const matches = options.filter(
    (option) =>
      option.toLowerCase().includes(lowerValue) || lowerValue.includes(option.toLowerCase())
  );

  return matches.length > 0 ? matches[0] : undefined;
}

/**
 * Valida si una fecha está en el pasado
 */
export function isDateInPast(dateString: string): boolean {
  try {
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return date < new Date();
  } catch {
    return false;
  }
}

/**
 * Obtiene sugerencia de formato basada en el campo
 */
export function getSuggestionForField(field: string, value: string): string | undefined {
  if (field.includes('CUIT')) {
    return formatCuitSuggestion(value);
  }

  if (field.includes('Email')) {
    return formatEmailSuggestion(value);
  }

  return undefined;
}

/**
 * Valida unicidad dentro de un array de datos
 */
export function validateUniqueInArray(
  value: string,
  field: string,
  allData: ExcelRowData[],
  currentIndex: number
): boolean {
  const stringValue = value.toString().trim().toLowerCase();

  const duplicates = allData.filter((row, index) => {
    const otherValue = row[field];
    return (
      otherValue &&
      otherValue.toString().trim().toLowerCase() === stringValue &&
      index !== currentIndex
    );
  });

  return duplicates.length === 0;
}

/**
 * Valida existencia en datos de referencia
 */
export function validateExistsInReference(
  value: string,
  referenceMap: Map<string, unknown>
): boolean {
  return referenceMap.has(value.toLowerCase());
}

/**
 * Crea error de validación estándar
 */
export function createValidationError(config: {
  row: number;
  field: string;
  value: ExcelCellValue;
  message: string;
  severity?: 'error' | 'warning';
  suggestion?: string;
}): ValidationError {
  return {
    row: config.row,
    column: config.field,
    field: config.field,
    value: config.value,
    message: config.message,
    severity: config.severity || 'error',
    suggestion: config.suggestion,
  };
}

/**
 * Valida que conductores tengan licencia
 */
export function validateDriverLicense(tipo: string, licencia: ExcelCellValue): boolean {
  if (tipo === 'Conductor') {
    return !!licencia && licencia.toString().trim() !== '';
  }
  return true;
}

/**
 * Valida valores booleanos como texto
 */
export function validateBooleanText(value: ExcelCellValue): boolean {
  if (!value) return true; // Opcional
  const v = value.toString().toLowerCase().trim();
  return v === 'sí' || v === 'si' || v === 'no';
}

/**
 * Valida tipos de empresa
 */
export function validateEmpresaType(value: ExcelCellValue): boolean {
  if (!value) return false;
  const v = value.toString().trim();
  return v === 'Propia' || v === 'Subcontratada';
}

/**
 * Valida tipos de personal
 */
export function validatePersonalType(value: ExcelCellValue): boolean {
  if (!value) return false;
  const validTypes = ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'];
  return validTypes.includes(value.toString().trim());
}
