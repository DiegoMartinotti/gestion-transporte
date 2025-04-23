"use strict";
/**
 * Validación de variables de entorno
 * Verifica que todas las variables de entorno críticas estén definidas
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Valida las variables de entorno requeridas
 * @throws {Error} Si falta alguna variable de entorno crítica
 */
function validateEnv() {
    logger_1.default.debug('Validando variables de entorno...');
    const requiredVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        const errorMessage = `Variables de entorno faltantes: ${missingVars.join(', ')}`;
        if (process.env.NODE_ENV === 'production') {
            logger_1.default.error(errorMessage);
            throw new Error(errorMessage);
        }
        else {
            logger_1.default.warn(`${errorMessage}. La aplicación podría no funcionar correctamente.`);
        }
    }
    else {
        logger_1.default.debug('Todas las variables de entorno requeridas están configuradas.');
    }
    // Validar valores específicos
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
        logger_1.default.warn(`NODE_ENV debe ser 'development', 'production' o 'test'. Valor actual: ${nodeEnv}`);
    }
    // Advertencias de seguridad
    if (process.env.NODE_ENV === 'production') {
        // Verificar la fortaleza de JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length < 32) {
            logger_1.default.warn('JWT_SECRET parece débil. Se recomienda un valor más largo y complejo para producción.');
        }
    }
}
exports.default = validateEnv;
//# sourceMappingURL=validateEnv.js.map