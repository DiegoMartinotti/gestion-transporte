require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');

async function testConnection() {
    try {
        logger.info('Intentando conectar a MongoDB...');
        logger.info('URI:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        logger.info('¡Conexión exitosa a MongoDB!');
        
        // Intentar crear un usuario de prueba
        const Usuario = require('./models/Usuario');
        const testUser = new Usuario({
            email: 'test@test.com',
            password: '123456',
            nombre: 'Test User'
        });
        
        await testUser.save();
        logger.info('Usuario de prueba creado exitosamente');
        
        // Buscar el usuario recién creado
        const foundUser = await Usuario.findOne({ email: 'test@test.com' });
        logger.info('Usuario encontrado:', foundUser);
        
    } catch (error) {
        logger.error('Error de conexión:', error);
    } finally {
        await mongoose.disconnect();
        logger.info('Conexión cerrada');
    }
}

testConnection();
