import express from 'express';
const router = express.Router();
import { login, register } from '../controllers/auth';
import { authenticateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import config from '../config/config';
import Usuario from '../models/Usuario';

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
        const { userId, email } = (req as unknown).user;
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

// Ruta temporal para actualizar roles de usuario (SOLO PARA DESARROLLO)
router.post('/update-roles', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const { email, roles } = req.body;
        
        if (!email || !roles) {
            res.status(400).json({
                success: false,
                message: 'Email y roles son requeridos'
            });
            return;
        }
        
        const user = await Usuario.findOneAndUpdate(
            { email: email },
            { $set: { roles: roles } },
            { new: true }
        );
        
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }
        
        logger.info(`Roles actualizados para ${email}: ${roles.join(', ')}`);
        
        res.json({
            success: true,
            message: 'Roles actualizados correctamente',
            user: {
                email: user.email,
                roles: user.roles
            }
        });
    } catch (error) {
        logger.error('Error actualizando roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta temporal para actualizar campo activo de cliente (SOLO PARA DESARROLLO)  
router.post('/fix-cliente', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const Cliente = require('../models/Cliente').default;
        
        const cliente = await Cliente.findOneAndUpdate(
            { _id: '67b8e22f8495fb070f964159' },
            { $set: { activo: true } },
            { new: true }
        );
        
        if (!cliente) {
            res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
            return;
        }
        
        logger.info(`Campo activo actualizado para cliente: ${cliente.nombre}`);
        
        res.json({
            success: true,
            message: 'Cliente actualizado correctamente',
            cliente: {
                nombre: cliente.nombre,
                activo: cliente.activo
            }
        });
    } catch (error) {
        logger.error('Error actualizando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router;