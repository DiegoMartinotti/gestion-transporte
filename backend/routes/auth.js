const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const config = require('../config/config');

// Middleware de logging para rutas de auth
router.use((req, res, next) => {
    logger.debug(`Auth Route: ${req.method} ${req.path}`);
    next();
});

// Rutas de autenticación
router.post('/login', login);
router.post('/register', register);

// Nueva ruta para obtener datos del usuario
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { userId, email } = req.user;
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
router.post('/logout', (req, res, next) => {
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

module.exports = router;
