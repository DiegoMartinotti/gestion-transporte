const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Middleware de logging para rutas de auth
router.use((req, res, next) => {
    console.log(`Auth Route: ${req.method} ${req.path}`);
    next();
});

router.post('/login', (req, res, next) => {
    console.log('Login attempt:', req.body);
    login(req, res, next);
});

router.post('/register', (req, res, next) => {
    console.log('Register attempt:', req.body);
    register(req, res, next);
});

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
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener datos del usuario' 
        });
    }
});

module.exports = router;
