const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

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
    console.log('Usuario creado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exit(1);
  }
}

createUser();
