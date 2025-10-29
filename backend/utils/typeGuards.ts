/**
 * Type guards reutilizables para verificación de tipos en runtime
 */

/**
 * Verifica si un error es un error de duplicado de MongoDB (código 11000)
 */
export const isMongoError = (
  error: unknown
): error is {
  code: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
} => {
  return !!(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'number'
  );
};

/**
 * Verifica si un error es un error de duplicado de MongoDB específicamente
 */
export const isDuplicateError = (
  error: unknown
): error is {
  code: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
} => {
  return isMongoError(error) && error.code === 11000;
};

/**
 * Verifica si un objeto tiene una propiedad específica con type narrowing
 */
export const hasProperty = <K extends string>(obj: unknown, key: K): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && key in obj;
};

/**
 * Verifica si un objeto es un Error estándar
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Verifica si un objeto tiene mensaje de error
 */
export const hasErrorMessage = (error: unknown): error is { message: string } => {
  return hasProperty(error, 'message') && typeof error.message === 'string';
};

/**
 * Obtiene un mensaje de error seguro desde unknown
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) return error.message;
  if (hasErrorMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
};

/**
 * Verifica si un objeto tiene propiedades de usuario autenticado
 */
export const hasUserProperty = (obj: unknown): obj is { user: { id: string; email: string } } => {
  return (
    hasProperty(obj, 'user') &&
    typeof obj.user === 'object' &&
    obj.user !== null &&
    'id' in obj.user &&
    'email' in obj.user
  );
};
