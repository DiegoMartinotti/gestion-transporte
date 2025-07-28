/**
 * Configuración global para tests del BaseService
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Configuración antes de todos los tests
beforeAll(async () => {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar mongoose al servidor de test
  await mongoose.connect(mongoUri);
});

// Limpieza después de cada test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  // Limpiar todas las colecciones
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Limpieza después de todos los tests
afterAll(async () => {
  // Desconectar mongoose
  await mongoose.disconnect();
  
  // Detener servidor MongoDB
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Configuración global de timeout
jest.setTimeout(30000);