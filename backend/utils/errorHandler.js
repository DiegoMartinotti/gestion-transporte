/**
 * Wrapper para manejo de errores en controladores async
 * @param {Function} fn - Función async del controlador
 */
const logger = require('./logger');

const tryCatch = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        logger.error('Error capturado:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Error del servidor'
        });
    }
};

module.exports = { tryCatch };
