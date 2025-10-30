/**
 * Type guards para manejo de errores
 * Solución para TS18046 (unknown type en catch)
 */

/**
 * Type guard para Error estándar
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Type guard para objeto con mensaje
 */
export const hasMessage = (error: unknown): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
};

/**
 * Extrae mensaje de error de forma segura
 */
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) return error.message;
  if (hasMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
};

/**
 * Type guard para MongoDB error
 */
export const isMongoError = (
  error: unknown
): error is Error & { code?: number; keyPattern?: Record<string, unknown> } => {
  return isError(error) && 'code' in error;
};

/**
 * Type guard para Mongoose validation error
 */
export const isValidationError = (
  error: unknown
): error is Error & { errors: Record<string, { message: string }> } => {
  return isError(error) && error.name === 'ValidationError' && 'errors' in error;
};

/**
 * Type guard para Cast error de Mongoose
 */
export const isCastError = (error: unknown): error is Error & { kind: string; path: string } => {
  return isError(error) && error.name === 'CastError';
};

/**
 * Formatea error de validación de Mongoose
 */
export const formatValidationErrors = (error: unknown): Record<string, string> | null => {
  if (!isValidationError(error)) return null;

  const formatted: Record<string, string> = {};
  for (const [field, fieldError] of Object.entries(error.errors)) {
    formatted[field] = fieldError.message;
  }
  return formatted;
};
