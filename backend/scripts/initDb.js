const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function initDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mydatabase');
    
    // Crear usuario admin si no existe
    const adminExists = await Usuario.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new Usuario({
        email: 'admin@example.com',
        password: hashedPassword,
        nombre: 'Administrador'
      });

      await adminUser.save();
      logger.info('Usuario administrador creado exitosamente');
    }

    logger.info('Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initDatabase();
