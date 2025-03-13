const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware de logging para rutas de auth
router.use((req, res, next) => {
    logger.debug(`Auth Route: ${req.method} ${req.path}`);
    next();
});

// Rutas de autenticación
router.post('/login', login);
router.post('/register', register);

// Nueva ruta para obtener datos del usuario
router.get('/me', auth, async (req, res) => {
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

module.exports = router;
