/**
 * Validación de variables de entorno
 * Verifica que todas las variables de entorno críticas estén definidas
 */

const logger = require('../utils/logger');

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
    } else {
      logger.warn(`${errorMessage}. La aplicación podría no funcionar correctamente.`);
    }
  } else {
    logger.debug('Todas las variables de entorno requeridas están configuradas.');
  }

  // Validar valores específicos
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    logger.warn(`NODE_ENV debe ser 'development', 'production' o 'test'. Valor actual: ${process.env.NODE_ENV}`);
  }

  // Advertencias de seguridad
  if (process.env.NODE_ENV === 'production') {
    // Verificar la fortaleza de JWT_SECRET
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      logger.warn('JWT_SECRET parece débil. Se recomienda un valor más largo y complejo para producción.');
    }
  }
}

module.exports = validateEnv; 