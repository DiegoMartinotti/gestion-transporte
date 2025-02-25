const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

// Usar la misma URL que en app.js
const MONGODB_URI = 'mongodb+srv://dbLiquidaciones:joseblanco4272@cluster0.ahw8j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function createInitialUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Verificar si ya existe
    const exists = await Usuario.findOne({ email: 'admin@example.com' });
    if (exists) {
      console.log('El usuario admin ya existe');
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
    console.log('Usuario admin creado exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createInitialUser();
