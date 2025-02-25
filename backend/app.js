const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware de logging mejorado
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (['POST', 'PUT'].includes(req.method)) {
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
    }
    next();
});

// CORS antes que otras middlewares
app.use(cors({
    origin: 'http://localhost:3000', // String en lugar de array
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Middleware adicional para headers CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Rutas
const authRouter = require('./routes/auth');
const apiRoutes = require('./routes/index');
const proxyRouter = require('./routes/proxy'); // Agregar importación del proxyRouter

// Rutas públicas
app.use('/api/auth', authRouter);

// Agregar el proxyRouter antes de las rutas protegidas
app.use('/api/proxy', proxyRouter); // Mover esta línea antes del middleware de autenticación

// Rutas protegidas
app.use('/api', apiRoutes);

// Middleware para rutas no encontradas
app.use((req, res) => {
    console.log('Ruta no encontrada:', req.path);
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de error
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ 
        message: err.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

// Log mejorado para debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.query) console.log('Query:', req.query);
    next();
});

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Servidor ejecutándose en http://localhost:${port}`);
            console.log('Rutas disponibles:');
            console.log('- POST /api/auth/login');
            console.log('- POST /api/auth/register');
            console.log('- GET /api/test');
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();
