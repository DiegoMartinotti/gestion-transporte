require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        logger.info('Intentando conectar a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, options);
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
