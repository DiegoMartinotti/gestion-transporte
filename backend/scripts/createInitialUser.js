require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const logger = require('../utils/logger');

// Usar las variables de entorno para la conexión
const { connectDB } = require('../config/database');

async function createInitialUser() {
  try {
    // Conectar usando la configuración segura
    await connectDB();
    
    // Verificar si ya existe
    const exists = await Usuario.findOne({ email: 'admin@example.com' });
    if (exists) {
      logger.info('El usuario admin ya existe');
      process.exit(0);
    }

    // Crear usuario
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const usuario = new Usuario({
      email: 'admin@example.com',
      password: hashedPassword,
      nombre: 'Administrador'
    });

    await usuario.save();
    logger.info('Usuario admin creado exitosamente');
    
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createInitialUser();
