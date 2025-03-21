require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Configurar opciones de conexión
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };
        
        // Construir la URI de conexión con variables de entorno
        const mongoURI = process.env.MONGODB_URI.replace(
            '${DB_PASSWORD}', 
            process.env.DB_PASSWORD
        );

        logger.info('Intentando conectar a MongoDB...');
        await mongoose.connect(mongoURI, options);
        logger.info('MongoDB conectado correctamente');
        
        mongoose.connection.on('error', err => {
            logger.error('Error de MongoDB:', err);
        });
    } catch (error) {
        logger.error('Error de conexión MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };
