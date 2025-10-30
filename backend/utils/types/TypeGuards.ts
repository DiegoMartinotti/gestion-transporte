/**
 * Type guards genéricos para unknown types
 * Solución para TS18046 (type unknown without guards)
 */

/**
 * Type guard para string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard para number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Type guard para boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type guard para object no null
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Type guard para array
 */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

/**
 * Type guard para array de tipo específico
 */
export const isArrayOf = <T>(value: unknown, guard: (item: unknown) => item is T): value is T[] => {
  return isArray(value) && value.every(guard);
};

/**
 * Type guard para object con campos específicos
 */
export const hasFields = <T extends string>(
  value: unknown,
  fields: T[]
): value is Record<T, unknown> => {
  if (!isObject(value)) return false;
  return fields.every((field) => field in value);
};

/**
 * Type guard para null o undefined
 */
export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

/**
 * Type guard para non-null
 */
export const isNonNull = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * Type guard para Record<string, unknown>
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isObject(value);
};

/**
 * Type guard para verificar si un objeto tiene una propiedad
 */
export const hasProperty = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return isObject(obj) && key in obj;
};

/**
 * Type guard para verificar si un objeto tiene una propiedad de tipo específico
 */
export const hasPropertyOfType = <K extends string, T>(
  obj: unknown,
  key: K,
  guard: (value: unknown) => value is T
): obj is Record<K, T> => {
  return hasProperty(obj, key) && guard(obj[key]);
};
