/**
 * Sistema de logging centralizado
 * 
 * Este módulo proporciona funciones para gestionar logs en la aplicación,
 * permitiendo mostrar solo errores en producción y logs completos en desarrollo.
 * Implementa niveles de log estándar: debug, info, warn, error, critical
 */

// Obtener el modo de entorno desde variables de entorno o usar desarrollo por defecto
const NODE_ENV: string = process.env.NODE_ENV || 'development';
const isDevelopment: boolean = NODE_ENV === 'development';
const isTest: boolean = NODE_ENV === 'test';

// Configuración de niveles de log
enum LOG_LEVEL {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
  NONE = 5
}

// Nivel mínimo de log según el entorno
const currentLogLevel: LOG_LEVEL = (() => {
  if (isTest) return LOG_LEVEL.ERROR; // Solo errores en pruebas
  if (isDevelopment) return LOG_LEVEL.DEBUG; // Todo en desarrollo
  return LOG_LEVEL.WARN; // Warn, error y critical en producción
})();

/**
 * Formatea la fecha actual para mostrarla en los logs
 * @returns Fecha formateada
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Logger para información de depuración
 * @param args - Argumentos a loggear
 */
const debug = (...args: any[]): void => {
  if (currentLogLevel <= LOG_LEVEL.DEBUG) {
    console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
  }
};

/**
 * Logger para información general
 * @param args - Argumentos a loggear
 */
const info = (...args: any[]): void => {
  if (currentLogLevel <= LOG_LEVEL.INFO) {
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
  }
};

/**
 * Logger para advertencias
 * @param args - Argumentos a loggear
 */
const warn = (...args: any[]): void => {
  if (currentLogLevel <= LOG_LEVEL.WARN) {
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  }
};

/**
 * Logger para errores
 * @param args - Argumentos a loggear
 */
const error = (...args: any[]): void => {
  if (currentLogLevel <= LOG_LEVEL.ERROR) {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
    
    // Capturar stack trace para errores cuando sea posible
    const errorObject = args.find(arg => arg instanceof Error);
    if (errorObject && errorObject.stack) {
      console.error(`[${getTimestamp()}] [ERROR] Stack:`, errorObject.stack);
    }
  }
};

/**
 * Logger para información crítica
 * @param args - Argumentos a loggear
 */
const critical = (...args: any[]): void => {
  if (currentLogLevel <= LOG_LEVEL.CRITICAL) {
    console.error(`[${getTimestamp()}] [CRITICAL]`, ...args);
    
    // Capturar stack trace para errores cuando sea posible
    const errorObject = args.find(arg => arg instanceof Error);
    if (errorObject && errorObject.stack) {
      console.error(`[${getTimestamp()}] [CRITICAL] Stack:`, errorObject.stack);
    }
  }
};

// Interceptar errores no capturados
process.on('uncaughtException', (err: Error) => {
  critical('Excepción no capturada:', err);
  // En producción podríamos notificar a un servicio externo
});

// Interceptar promesas rechazadas no capturadas
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  critical('Promesa rechazada no capturada:', reason);
});

// Función para obtener el nivel de log actual (útil para pruebas)
const getCurrentLogLevel = (): LOG_LEVEL => currentLogLevel;

export {
  debug,
  info,
  warn,
  error,
  critical,
  LOG_LEVEL,
  getCurrentLogLevel
};

export default {
  debug,
  info,
  warn,
  error,
  critical,
  LOG_LEVEL,
  getCurrentLogLevel
}; 