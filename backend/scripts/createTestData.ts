import mongoose from 'mongoose';
import Cliente from '../models/Cliente';
import Site from '../models/Site';
import Tramo from '../models/Tramo';
import Usuario from '../models/Usuario';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createTestData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI?.replace('${DB_PASSWORD}', process.env.DB_PASSWORD || '') || 'mongodb://localhost:27017/gestion-transporte');
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
    let siteOrigen = await Site.findOne({ nombre: 'Buenos Aires', cliente: cliente._id });
    if (!siteOrigen) {
      siteOrigen = await Site.create({
        nombre: 'Buenos Aires',
        direccion: 'Av. 9 de Julio 1000, Buenos Aires',
        cliente: cliente._id,
        location: {
          type: 'Point',
          coordinates: [-58.381592, -34.603722] // [longitude, latitude]
        }
      });
      console.log('Site origen creado:', siteOrigen.nombre);
    }

    let siteDestino = await Site.findOne({ nombre: 'Rosario', cliente: cliente._id });
    if (!siteDestino) {
      siteDestino = await Site.create({
        nombre: 'Rosario',
        direccion: 'Av. Pellegrini 1000, Rosario',
        cliente: cliente._id,
        location: {
          type: 'Point',
          coordinates: [-60.639881, -32.946819] // [longitude, latitude]
        }
      });
      console.log('Site destino creado:', siteDestino.nombre);
    }

    // Crear tramo con tarifas históricas
    let tramo = await Tramo.findOne({ 
      cliente: cliente._id, 
      origen: siteOrigen._id, 
      destino: siteDestino._id 
    });
    
    if (!tramo) {
      tramo = await Tramo.create({
        cliente: cliente._id,
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