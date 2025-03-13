/**
 * Sistema de logging centralizado
 * 
 * Este módulo proporciona funciones para gestionar logs en la aplicación,
 * permitiendo mostrar solo errores en producción y logs completos en desarrollo.
 */

// Forzar modo producción
const isDevelopment = false;

/**
 * Logger para información general
 * Solo se muestra en entorno de desarrollo
 * @param {...any} args - Argumentos a loggear
 */
const info = (...args) => {
  if (isDevelopment) {
    console.log(...args);
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
 * Solo se muestra en entorno de desarrollo o si contiene error
 * @param {...any} args - Argumentos a loggear
 */
const warn = (...args) => {
  if (isDevelopment || (args[0] && typeof args[0] === 'string' && args[0].includes('Error'))) {
    console.warn('[WARN]', ...args);
  }
};

/**
 * Logger para errores
 * Se muestra en todos los entornos
 * @param {...any} args - Argumentos a loggear
 */
const error = (...args) => {
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

// Interceptar errores no capturados
process.on('uncaughtException', (err) => {
  critical('Excepción no capturada:', err);
});

// Interceptar promesas rechazadas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  critical('Promesa rechazada no capturada:', reason);
});

module.exports = {
  info,
  debug,
  warn,
  error,
  critical
}; 