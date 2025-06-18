import express from 'express';
const router = express.Router();
import { login, register } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import config from '../config/config';

// Middleware de logging para rutas de auth
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.debug(`Auth Route: ${req.method} ${req.path}`);
    next();
});

// Rutas de autenticación
router.post('/login', login);
router.post('/register', register);

// Nueva ruta para obtener datos del usuario
router.get('/me', authenticateToken, async (req: express.Request, res: express.Response) => {
    try {
        const { userId, email } = (req as any).user;
        res.json({
            success: true,
            user: {
                id: userId,
                email: email
            }
        });
    } catch (error) {
        logger.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener datos del usuario' 
        });
    }
});

// Ruta para cerrar sesión
router.post('/logout', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Limpiar la cookie del token
        res.clearCookie('token', {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict'
        });
        
        logger.debug('Sesión cerrada exitosamente');
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        next(error);
    }
});

export default router;