require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('Intentando conectar a MongoDB...');
        console.log('URI:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('¡Conexión exitosa a MongoDB!');
        
        // Intentar crear un usuario de prueba
        const Usuario = require('./models/Usuario');
        const testUser = new Usuario({
            email: 'test@test.com',
            password: '123456',
            nombre: 'Test User'
        });
        
        await testUser.save();
        console.log('Usuario de prueba creado exitosamente');
        
        // Buscar el usuario recién creado
        const foundUser = await Usuario.findOne({ email: 'test@test.com' });
        console.log('Usuario encontrado:', foundUser);
        
    } catch (error) {
        console.error('Error de conexión:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Conexión cerrada');
    }
}

testConnection();
