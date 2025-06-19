import logger from './logger';
/**
 * Envuelve un controlador async/await con manejo de errores
 * @param fn - Función async del controlador
 * @returns Función de middleware con manejo de errores
 */
const tryCatch = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (error) {
        const err = error;
        logger.error('Error capturado:', err);
        if (err.name === 'ValidationError' && err.errors) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(err.errors).map(e => e.message)
            });
        }
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Error del servidor'
        });
    }
};
export { tryCatch };
//# sourceMappingURL=errorHandler.js.map