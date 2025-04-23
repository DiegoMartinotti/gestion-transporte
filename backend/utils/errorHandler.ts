/**
 * Wrapper para manejo de errores en controladores async
 */
import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Tipo para cualquier error con propiedades opcionales adicionales
 */
interface ExtendedError extends Error {
  status?: number;
  errors?: Record<string, { message: string }>;
}

/**
 * Tipo para una función de controlador
 */
type ControllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Envuelve un controlador async/await con manejo de errores
 * @param fn - Función async del controlador
 * @returns Función de middleware con manejo de errores
 */
const tryCatch = (fn: ControllerFunction) => async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        await fn(req, res, next);
    } catch (error) {
        const err = error as ExtendedError;
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