/**
 * Helper functions for Excel template validation
 * Provides reusable validation utilities for all Excel templates
 */

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const CUIT_WITH_HYPHEN_REGEX = /^\d{2}-\d{8}-\d$/;
export const CUIT_OPTIONAL_HYPHEN_REGEX = /^(?:20|23|24|25|26|27|30|33|34)(?:\d{9}|-\d{8}-\d)$/;
export const DNI_REGEX = /^\d{7,8}$/;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface FieldValidation {
  value: string | number | boolean | Date | null | undefined;
  fieldName: string;
  rowNum: number;
  required?: boolean;
}

/**
 * Validates required fields
 */
export function validateRequiredFields(fields: FieldValidation[]): ValidationResult {
  const errors: string[] = [];

  for (const field of fields) {
    if (field.required && (!field.value || field.value.toString().trim() === '')) {
      errors.push(`Fila ${field.rowNum}: ${field.fieldName} es obligatorio`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 */
export function validateEmailFormat(
  email: string,
  rowNum: number,
  fieldName = 'Email'
): ValidationResult {
  const errors: string[] = [];

  if (email && email.trim()) {
    const normalizedEmail = email.trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      errors.push(`Fila ${rowNum}: ${fieldName} con formato inválido`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates DNI format (7-8 digits)
 */
export function validateDNIFormat(dni: string, rowNum: number): ValidationResult {
  const errors: string[] = [];

  if (dni) {
    const normalizedDni = dni.toString().trim();
    if (!DNI_REGEX.test(normalizedDni)) {
      errors.push(`Fila ${rowNum}: DNI con formato inválido (debe ser 7-8 dígitos)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates CUIL format (XX-XXXXXXXX-X)
 */
export function validateCUILFormat(cuil: string, rowNum: number): ValidationResult {
  const errors: string[] = [];

  if (cuil && cuil.trim()) {
    const normalizedCuil = cuil.trim();
    if (!CUIT_WITH_HYPHEN_REGEX.test(normalizedCuil)) {
      errors.push(`Fila ${rowNum}: CUIL con formato inválido (debe ser XX-XXXXXXXX-X)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates CUIT format (XX-XXXXXXXX-X)
 */
export function validateCUITFormat(cuit: string, rowNum: number): ValidationResult {
  const errors: string[] = [];

  if (cuit && cuit.trim()) {
    const normalizedCuit = cuit.trim();
    if (!CUIT_WITH_HYPHEN_REGEX.test(normalizedCuit)) {
      errors.push(`Fila ${rowNum}: CUIT con formato inválido (debe ser XX-XXXXXXXX-X)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates for duplicate values
 */
export function validateDuplicates(
  value: string,
  rowNum: number,
  seenValues: Set<string>,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value) {
    const normalizedValue = value.toString().trim().toLowerCase();
    if (seenValues.has(normalizedValue)) {
      errors.push(`Fila ${rowNum}: ${fieldName} duplicado en el archivo`);
    } else {
      seenValues.add(normalizedValue);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parses date in DD/MM/YYYY or YYYY-MM-DD format
 */
export function parseDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;

  // If already a Date object
  if (dateStr instanceof Date) {
    return dateStr;
  }

  // Try to parse string date
  const str = dateStr.toString().trim();
  if (!str) return null;

  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try YYYY-MM-DD format
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Try to parse as standard date
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats date to DD/MM/YYYY string
 */
export function formatDate(date: Date | null): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Validates that a value exists in a reference list
 */
export function validateInReferenceList<T>(
  value: string,
  referenceMap: Map<string, T>,
  options: {
    rowNum: number;
    fieldName: string;
    notFoundMessage?: string;
  }
): ValidationResult & { referenceId?: T } {
  const errors: string[] = [];
  let referenceId: T | undefined;

  if (value) {
    const normalizedValue = value.trim();

    // Try exact match first
    if (referenceMap.has(normalizedValue)) {
      referenceId = referenceMap.get(normalizedValue);
    } else {
      // Try case-insensitive match
      for (const [key, val] of Array.from(referenceMap.entries())) {
        if (key.toLowerCase() === normalizedValue.toLowerCase()) {
          referenceId = val;
          break;
        }
      }

      if (!referenceId) {
        errors.push(
          options.notFoundMessage ||
            `Fila ${options.rowNum}: ${options.fieldName} "${normalizedValue}" no encontrado`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    referenceId,
  };
}

/**
 * Validates enum/option values
 */
export function validateEnumValue(
  value: string,
  rowNum: number,
  validValues: string[],
  fieldName: string
): ValidationResult {
  const errors: string[] = [];

  if (value) {
    const normalizedValue = value.trim();
    const isValid = validValues.some(
      (valid) => valid.toLowerCase() === normalizedValue.toLowerCase()
    );

    if (!isValid) {
      errors.push(
        `Fila ${rowNum}: ${fieldName} inválido. Valores permitidos: ${validValues.join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates numeric values
 */
/**
 * Helper para validar rango numérico
 */
function validateNumericRange(
  num: number,
  fieldName: string,
  rowNum: number,
  options?: { min?: number; max?: number; integer?: boolean }
): string[] {
  const errors: string[] = [];

  if (options?.integer && !Number.isInteger(num)) {
    errors.push(`Fila ${rowNum}: ${fieldName} debe ser un número entero`);
  }
  if (options?.min !== undefined && num < options.min) {
    errors.push(`Fila ${rowNum}: ${fieldName} debe ser mayor o igual a ${options.min}`);
  }
  if (options?.max !== undefined && num > options.max) {
    errors.push(`Fila ${rowNum}: ${fieldName} debe ser menor o igual a ${options.max}`);
  }

  return errors;
}

export function validateNumericValue(
  value: string | number | null | undefined,
  rowNum: number,
  fieldName: string,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): ValidationResult {
  // Salir temprano si no hay valor
  if (value === null || value === undefined || value === '') {
    return { isValid: true, errors: [] };
  }

  const num = Number(value);

  // Validar que sea un número
  if (isNaN(num)) {
    return {
      isValid: false,
      errors: [`Fila ${rowNum}: ${fieldName} debe ser un número`],
    };
  }

  // Delegar validaciones de rango a función auxiliar
  const errors = validateNumericRange(num, fieldName, rowNum, options);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates boolean values (Sí/No, Si/No, true/false, 1/0)
 */
export function parseBooleanValue(value: string | number | boolean | null | undefined): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  const strValue = value.toString().trim().toLowerCase();
  return (
    strValue === 'sí' ||
    strValue === 'si' ||
    strValue === 'true' ||
    strValue === '1' ||
    strValue === 'yes'
  );
}

/**
 * Combines multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Creates a formatted error message with row number
 */
export function formatRowError(rowNum: number, message: string): string {
  return `Fila ${rowNum}: ${message}`;
}

/**
 * Validates phone number format
 */
export function validatePhoneFormat(
  phone: string,
  rowNum: number,
  fieldName = 'Teléfono'
): ValidationResult {
  const errors: string[] = [];

  if (phone && phone.trim()) {
    // Remove common separators
    const cleanPhone = phone.replace(/[\s\-().]/g, '');

    // Check if it contains only digits and optional + at the beginning
    if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
      errors.push(`Fila ${rowNum}: ${fieldName} con formato inválido`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates postal code format
 */
export function validatePostalCode(postalCode: string, rowNum: number): ValidationResult {
  const errors: string[] = [];

  if (postalCode && postalCode.trim()) {
    // Argentine postal codes can be 4 digits or letter + 4 digits + 3 letters
    const simpleFormat = /^\d{4}$/;
    const complexFormat = /^[A-Z]\d{4}[A-Z]{3}$/;

    const cleanCode = postalCode.trim().toUpperCase();

    if (!simpleFormat.test(cleanCode) && !complexFormat.test(cleanCode)) {
      errors.push(`Fila ${rowNum}: Código postal con formato inválido`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
