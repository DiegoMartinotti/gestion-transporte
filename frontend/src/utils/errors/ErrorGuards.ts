/**
 * Type guards para manejo de errores en React/Axios
 * Solución para TS18046 (unknown type en catch)
 */

import { AxiosError } from 'axios';

/**
 * Type guard para Error estándar
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * Type guard para AxiosError
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError: unknown }).isAxiosError === true
  );
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
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Error de red';
  }
  if (isError(error)) return error.message;
  if (hasMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
};

/**
 * Type guard para error de validación del backend
 */
export const isValidationError = (
  error: unknown
): error is AxiosError<{ errors: Record<string, string> }> => {
  return (
    isAxiosError(error) &&
    error.response?.status === 400 &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'errors' in error.response.data
  );
};

/**
 * Extrae errores de validación
 */
export const getValidationErrors = (error: unknown): Record<string, string> | null => {
  if (isValidationError(error)) {
    return error.response?.data.errors || null;
  }
  return null;
};

/**
 * Type guard para error de autenticación
 */
export const isAuthError = (error: unknown): error is AxiosError => {
  return isAxiosError(error) && error.response?.status === 401;
};

/**
 * Type guard para error de permisos
 */
export const isForbiddenError = (error: unknown): error is AxiosError => {
  return isAxiosError(error) && error.response?.status === 403;
};

/**
 * Type guard para error not found
 */
export const isNotFoundError = (error: unknown): error is AxiosError => {
  return isAxiosError(error) && error.response?.status === 404;
};
