const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

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

module.exports = router;
