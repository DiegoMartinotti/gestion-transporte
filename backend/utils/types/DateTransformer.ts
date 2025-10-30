/**
 * Transformador bidireccional para Date ↔ string ISO
 * Solución para TS2322 (type incompatibility) en fechas
 */

/**
 * Convierte Date a string ISO, manejando null/undefined
 */
export const dateToString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  if (!(date instanceof Date)) return null;
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

/**
 * Convierte string ISO a Date, manejando null/undefined
 */
export const stringToDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  if (typeof dateString !== 'string') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Transforma objeto con campos de fecha de Date a string
 */
export const transformDatesToStrings = <T extends Record<string, unknown>>(
  obj: T,
  dateFields: (keyof T)[]
): T => {
  const result = { ...obj };
  for (const field of dateFields) {
    if (result[field] instanceof Date) {
      result[field] = dateToString(result[field] as Date) as T[keyof T];
    }
  }
  return result;
};

/**
 * Transforma objeto con campos de fecha de string a Date
 */
export const transformStringsToDates = <T extends Record<string, unknown>>(
  obj: T,
  dateFields: (keyof T)[]
): T => {
  const result = { ...obj };
  for (const field of dateFields) {
    if (typeof result[field] === 'string') {
      result[field] = stringToDate(result[field] as string) as T[keyof T];
    }
  }
  return result;
};

/**
 * Type guard para verificar si un valor es una fecha válida
 */
export const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Type guard para verificar si un string es una fecha ISO válida
 */
export const isValidISOString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};
