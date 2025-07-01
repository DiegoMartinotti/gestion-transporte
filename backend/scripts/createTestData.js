const mongoose = require('mongoose');
const Cliente = require('../models/Cliente');
const Site = require('../models/Site');
const Tramo = require('../models/Tramo');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

require('dotenv').config();

async function createTestData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestion-transporte');
    console.log('Conectado a MongoDB');

    // Verificar si ya existe el usuario test
    let user = await Usuario.findOne({ email: 'test@example.com' });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await Usuario.create({
        nombre: 'Usuario Test',
        email: 'test@example.com',
        password: hashedPassword,
        roles: ['admin']
      });
      console.log('Usuario test creado');
    }

    // Crear o buscar cliente
    let cliente = await Cliente.findOne({ nombre: 'Cliente Test' });
    if (!cliente) {
      cliente = await Cliente.create({
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        telefono: '123456789',
        direccion: 'Calle Test 123',
        cuit: '20-12345678-9',
        activo: true
      });
      console.log('Cliente creado:', cliente.nombre);
    }

    // Crear sitios
    let siteOrigen = await Site.findOne({ nombre: 'Buenos Aires', cliente: cliente.nombre });
    if (!siteOrigen) {
      siteOrigen = await Site.create({
        nombre: 'Buenos Aires',
        direccion: 'Av. 9 de Julio 1000, Buenos Aires',
        cliente: cliente.nombre,
        latitud: -34.603722,
        longitud: -58.381592,
        activo: true
      });
      console.log('Site origen creado:', siteOrigen.nombre);
    }

    let siteDestino = await Site.findOne({ nombre: 'Rosario', cliente: cliente.nombre });
    if (!siteDestino) {
      siteDestino = await Site.create({
        nombre: 'Rosario',
        direccion: 'Av. Pellegrini 1000, Rosario',
        cliente: cliente.nombre,
        latitud: -32.946819,
        longitud: -60.639881,
        activo: true
      });
      console.log('Site destino creado:', siteDestino.nombre);
    }

    // Crear tramo con tarifas históricas
    let tramo = await Tramo.findOne({ 
      cliente: cliente.nombre, 
      origen: siteOrigen._id, 
      destino: siteDestino._id 
    });
    
    if (!tramo) {
      tramo = await Tramo.create({
        cliente: cliente.nombre,
        origen: siteOrigen._id,
        destino: siteDestino._id,
        distancia: 300, // 300 km aproximadamente
        tarifasHistoricas: [
          {
            tipo: 'TRMC',
            metodoCalculo: 'Palet',
            valor: 1500,
            valorPeaje: 200,
            vigenciaDesde: new Date('2024-01-01'),
            vigenciaHasta: new Date('2024-12-31')
          },
          {
            tipo: 'TRMI',
            metodoCalculo: 'Palet',
            valor: 1200,
            valorPeaje: 200,
            vigenciaDesde: new Date('2024-01-01'),
            vigenciaHasta: new Date('2024-12-31')
          },
          {
            tipo: 'TRMC',
            metodoCalculo: 'Palet',
            valor: 1800,
            valorPeaje: 250,
            vigenciaDesde: new Date('2025-01-01'),
            vigenciaHasta: new Date('2025-12-31')
          },
          {
            tipo: 'TRMI',
            metodoCalculo: 'Palet',
            valor: 1400,
            valorPeaje: 250,
            vigenciaDesde: new Date('2025-01-01'),
            vigenciaHasta: new Date('2025-12-31')
          }
        ],
        activo: true
      });
      console.log('Tramo creado con tarifas vigentes');
    }

    console.log('\nDatos de prueba creados exitosamente!');
    console.log('Puedes usar:');
    console.log('- Email: test@example.com');
    console.log('- Password: password123');
    console.log('- Cliente: Cliente Test');
    console.log('- Tramo: Buenos Aires -> Rosario');
    
  } catch (error) {
    console.error('Error creando datos de prueba:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();