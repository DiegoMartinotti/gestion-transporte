/**
 * Transformador bidireccional para Date ↔ string ISO en React
 * Solución para TS2322 (type incompatibility) en DatePicker y formularios
 */

/**
 * Convierte Date a string ISO, manejando null/undefined
 */
export const dateToString = (date: Date | null | undefined): string => {
  if (!date) return '';
  if (!(date instanceof Date)) return '';
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
};

/**
 * Convierte string ISO a Date, manejando null/undefined/empty
 */
export const stringToDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString || dateString === '') return null;
  if (typeof dateString !== 'string') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formatea Date para DatePicker de Mantine (espera Date | null)
 */
export const formatForDatePicker = (dateString: string | null | undefined): Date | null => {
  return stringToDate(dateString);
};

/**
 * Formatea desde DatePicker a string ISO para backend
 */
export const formatFromDatePicker = (date: Date | null): string => {
  return dateToString(date);
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
 * Hook helper para manejar cambios de DatePicker
 */
export const createDateChangeHandler = (
  setValue: (value: string) => void
): ((date: Date | null) => void) => {
  return (date: Date | null) => {
    setValue(formatFromDatePicker(date));
  };
};

/**
 * Type guard para verificar si un valor es una fecha válida
 */
export const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};
