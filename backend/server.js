// Si este archivo no existe, crear con esta configuración

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Incrementar límite para importaciones grandes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar mongoose para que use el nuevo motor y evite warnings
mongoose.set('strictQuery', false);

// Conexión a MongoDB con opciones para depuración
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Activar debug para operaciones con mongo
    debug: process.env.NODE_ENV !== 'production'
})
.then(() => {
    console.log('Conexión a MongoDB establecida');
})
.catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
});

// Rutas
const tramoRoutes = require('./routes/tramoRoutes');
const siteRoutes = require('./routes/siteRoutes');

app.use('/api/tramos', tramoRoutes);
app.use('/api/sites', siteRoutes);

// Ruta básica para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('API de gestión de tramos - Funcionando correctamente');
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
