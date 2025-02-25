const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        console.log('Intentando conectar a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log('MongoDB conectado correctamente');
        
        mongoose.connection.on('error', err => {
            console.error('Error de MongoDB:', err);
        });
    } catch (error) {
        console.error('Error de conexión MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };
