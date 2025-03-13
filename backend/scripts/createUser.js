const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const logger = require('../utils/logger');

mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createUser() {
  try {
    const usuario = new Usuario({
      email: 'admin@example.com',
      password: 'admin123',
      nombre: 'Administrador'
    });

    await usuario.save();
    logger.info('Usuario creado exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    process.exit(1);
  }
}

createUser();
