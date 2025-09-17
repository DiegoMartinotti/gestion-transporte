import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ClienteService } from '../../services/cliente/clienteService';
import { VehiculoService } from '../../services/vehiculo/vehiculoService';

// Test simplificado para verificar BaseService
describe('BaseService Simple Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let clienteService: ClienteService;
  let vehiculoService: VehiculoService;

  beforeAll(async () => {
    // Desconectar cualquier conexión existente
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    clienteService = new ClienteService();
    vehiculoService = new VehiculoService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar colecciones
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Cliente Service with BaseService', () => {
    it('should create and retrieve cliente', async () => {
      const testCliente = {
        nombre: 'Cliente Test Simple',
        cuit: '20-12345678-9',
        activo: true
      };

      // Create
      const created = await clienteService.create(testCliente);
      expect(created).toBeDefined();
      expect(created.nombre).toBe(testCliente.nombre);
      expect(created.cuit).toBe(testCliente.cuit);

      // Read
      const clienteId = (created as unknown)._id.toString();
      const found = await clienteService.getById(clienteId);
      expect(found).toBeDefined();
      expect(found!.nombre).toBe(testCliente.nombre);
    });

    it('should get all with pagination', async () => {
      // Crear 3 clientes
      await clienteService.create({ nombre: 'Cliente 1', cuit: '20-11111111-1', activo: true });
      await clienteService.create({ nombre: 'Cliente 2', cuit: '20-22222222-2', activo: true });
      await clienteService.create({ nombre: 'Cliente 3', cuit: '20-33333333-3', activo: true });

      const result = await clienteService.getAll({ pagina: 1, limite: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.paginacion.total).toBe(3);
      expect(result.paginacion.paginaActual).toBe(1);
      expect(result.paginacion.paginas).toBe(2);
    });

    it('should update cliente', async () => {
      const created = await clienteService.create({
        nombre: 'Cliente Original',
        cuit: '20-99999999-9',
        activo: true
      });

      const clienteId = (created as unknown)._id.toString();
      const updated = await clienteService.update(clienteId, { nombre: 'Cliente Actualizado' });
      
      expect(updated).toBeDefined();
      expect(updated!.nombre).toBe('Cliente Actualizado');
      expect(updated!.cuit).toBe('20-99999999-9'); // No cambió
    });

    it('should delete cliente', async () => {
      const created = await clienteService.create({
        nombre: 'Cliente a Eliminar',
        cuit: '20-88888888-8',
        activo: true
      });

      const clienteId = (created as unknown)._id.toString();
      const deleted = await clienteService.delete(clienteId);
      
      expect(deleted).toBe(true);
      
      const found = await clienteService.getById(clienteId);
      expect(found).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk creation efficiently', async () => {
      const startTime = Date.now();
      
      // Crear 20 clientes en paralelo
      const promises = Array.from({ length: 20 }, (_, i) => 
        clienteService.create({
          nombre: `Cliente Bulk ${i}`,
          cuit: `20-12345${i.toString().padStart(3, '0')}-${i % 10}`,
          activo: true
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Verificar que se crearon todos
      const result = await clienteService.getAll({ pagina: 1, limite: 50 });
      expect(result.paginacion.total).toBe(20);
      
      // Debe completarse en tiempo razonable
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ID gracefully', async () => {
      const result = await clienteService.getById('invalid-id');
      expect(result).toBeNull();
    });

    it('should handle non-existent ID for deletion', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await clienteService.delete(fakeId);
      expect(result).toBe(false);
    });
  });
});