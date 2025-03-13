/**
 * Sistema de logging centralizado para el frontend
 * 
 * Este módulo proporciona funciones para gestionar logs en la aplicación frontend,
 * permitiendo mostrar solo errores en producción y logs completos en desarrollo.
 */

// Determinar el entorno de ejecución
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Logger para información general
 * Solo se muestra en entorno de desarrollo
 * @param {...any} args - Argumentos a loggear
 */
const info = (...args) => {
  if (isDevelopment) {
    console.log('[INFO]', ...args);
  }
};

/**
 * Logger para información de depuración
 * Solo se muestra en entorno de desarrollo
 * @param {...any} args - Argumentos a loggear
 */
const debug = (...args) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Logger para advertencias
 * Solo se muestra en entorno de desarrollo
 * @param {...any} args - Argumentos a loggear
 */
const warn = (...args) => {
  if (isDevelopment) {
    console.warn('[WARN]', ...args);
  } else {
    // En producción, también mostrar advertencias importantes
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
      console.warn('[WARN]', ...args);
    }
  }
};

/**
 * Logger para errores
 * Se muestra en todos los entornos
 * @param {...any} args - Argumentos a loggear
 */
const error = (...args) => {
  // Siempre mostrar errores, independientemente del entorno
  console.error('[ERROR]', ...args);
};

/**
 * Logger para información crítica
 * Se muestra en todos los entornos
 * @param {...any} args - Argumentos a loggear
 */
const critical = (...args) => {
  console.error('[CRITICAL]', ...args);
};

export default {
  info,
  debug,
  warn,
  error,
  critical
}; 