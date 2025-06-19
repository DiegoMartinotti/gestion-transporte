/**
 * Validación de variables de entorno
 * Verifica que todas las variables de entorno críticas estén definidas
 */
import logger from '../utils/logger';
/**
 * Valida las variables de entorno requeridas
 * @throws {Error} Si falta alguna variable de entorno crítica
 */
function validateEnv() {
    logger.debug('Validando variables de entorno...');
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
            logger.error(errorMessage);
            throw new Error(errorMessage);
        }
        else {
            logger.warn(`${errorMessage}. La aplicación podría no funcionar correctamente.`);
        }
    }
    else {
        logger.debug('Todas las variables de entorno requeridas están configuradas.');
    }
    // Validar valores específicos
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
        logger.warn(`NODE_ENV debe ser 'development', 'production' o 'test'. Valor actual: ${nodeEnv}`);
    }
    // Advertencias de seguridad
    if (process.env.NODE_ENV === 'production') {
        // Verificar la fortaleza de JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && jwtSecret.length < 32) {
            logger.warn('JWT_SECRET parece débil. Se recomienda un valor más largo y complejo para producción.');
        }
    }
}
export default validateEnv;
//# sourceMappingURL=validateEnv.js.map