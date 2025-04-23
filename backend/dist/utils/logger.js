"use strict";
/**
 * Sistema de logging centralizado
 *
 * Este módulo proporciona funciones para gestionar logs en la aplicación,
 * permitiendo mostrar solo errores en producción y logs completos en desarrollo.
 * Implementa niveles de log estándar: debug, info, warn, error, critical
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLogLevel = exports.LOG_LEVEL = exports.critical = exports.error = exports.warn = exports.info = exports.debug = void 0;
// Obtener el modo de entorno desde variables de entorno o usar desarrollo por defecto
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';
// Configuración de niveles de log
var LOG_LEVEL;
(function (LOG_LEVEL) {
    LOG_LEVEL[LOG_LEVEL["DEBUG"] = 0] = "DEBUG";
    LOG_LEVEL[LOG_LEVEL["INFO"] = 1] = "INFO";
    LOG_LEVEL[LOG_LEVEL["WARN"] = 2] = "WARN";
    LOG_LEVEL[LOG_LEVEL["ERROR"] = 3] = "ERROR";
    LOG_LEVEL[LOG_LEVEL["CRITICAL"] = 4] = "CRITICAL";
    LOG_LEVEL[LOG_LEVEL["NONE"] = 5] = "NONE";
})(LOG_LEVEL || (exports.LOG_LEVEL = LOG_LEVEL = {}));
// Nivel mínimo de log según el entorno
const currentLogLevel = (() => {
    if (isTest)
        return LOG_LEVEL.ERROR; // Solo errores en pruebas
    if (isDevelopment)
        return LOG_LEVEL.DEBUG; // Todo en desarrollo
    return LOG_LEVEL.WARN; // Warn, error y critical en producción
})();
/**
 * Formatea la fecha actual para mostrarla en los logs
 * @returns Fecha formateada
 */
const getTimestamp = () => {
    return new Date().toISOString();
};
/**
 * Logger para información de depuración
 * @param args - Argumentos a loggear
 */
const debug = (...args) => {
    if (currentLogLevel <= LOG_LEVEL.DEBUG) {
        console.log(`[${getTimestamp()}] [DEBUG]`, ...args);
    }
};
exports.debug = debug;
/**
 * Logger para información general
 * @param args - Argumentos a loggear
 */
const info = (...args) => {
    if (currentLogLevel <= LOG_LEVEL.INFO) {
        console.log(`[${getTimestamp()}] [INFO]`, ...args);
    }
};
exports.info = info;
/**
 * Logger para advertencias
 * @param args - Argumentos a loggear
 */
const warn = (...args) => {
    if (currentLogLevel <= LOG_LEVEL.WARN) {
        console.warn(`[${getTimestamp()}] [WARN]`, ...args);
    }
};
exports.warn = warn;
/**
 * Logger para errores
 * @param args - Argumentos a loggear
 */
const error = (...args) => {
    if (currentLogLevel <= LOG_LEVEL.ERROR) {
        console.error(`[${getTimestamp()}] [ERROR]`, ...args);
        // Capturar stack trace para errores cuando sea posible
        const errorObject = args.find(arg => arg instanceof Error);
        if (errorObject && errorObject.stack) {
            console.error(`[${getTimestamp()}] [ERROR] Stack:`, errorObject.stack);
        }
    }
};
exports.error = error;
/**
 * Logger para información crítica
 * @param args - Argumentos a loggear
 */
const critical = (...args) => {
    if (currentLogLevel <= LOG_LEVEL.CRITICAL) {
        console.error(`[${getTimestamp()}] [CRITICAL]`, ...args);
        // Capturar stack trace para errores cuando sea posible
        const errorObject = args.find(arg => arg instanceof Error);
        if (errorObject && errorObject.stack) {
            console.error(`[${getTimestamp()}] [CRITICAL] Stack:`, errorObject.stack);
        }
    }
};
exports.critical = critical;
// Interceptar errores no capturados
process.on('uncaughtException', (err) => {
    critical('Excepción no capturada:', err);
    // En producción podríamos notificar a un servicio externo
});
// Interceptar promesas rechazadas no capturadas
process.on('unhandledRejection', (reason, promise) => {
    critical('Promesa rechazada no capturada:', reason);
});
// Función para obtener el nivel de log actual (útil para pruebas)
const getCurrentLogLevel = () => currentLogLevel;
exports.getCurrentLogLevel = getCurrentLogLevel;
exports.default = {
    debug,
    info,
    warn,
    error,
    critical,
    LOG_LEVEL,
    getCurrentLogLevel
};
//# sourceMappingURL=logger.js.map