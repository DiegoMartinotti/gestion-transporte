import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ClienteService } from '../../services/cliente/clienteService';
import { VehiculoService } from '../../services/vehiculo/vehiculoService';
import { TramoService } from '../../services/tramo/tramoService';
import { SiteService } from '../../services/site/siteService';
import { EmpresaService } from '../../services/empresa/empresaService';
import { PersonalService } from '../../services/personal/personalService';

// Importar modelos para los tests
import Cliente from '../../models/Cliente';
import Vehiculo from '../../models/Vehiculo';
import Tramo from '../../models/Tramo';
import Site from '../../models/Site';
import Empresa from '../../models/Empresa';
import Personal from '../../models/Personal';

describe('BaseService Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  
  // Servicios a testear
  let clienteService: ClienteService;
  let vehiculoService: VehiculoService;
  let tramoService: TramoService;
  let siteService: SiteService;
  let empresaService: EmpresaService;
  let personalService: PersonalService;

  beforeAll(async () => {
    // Configurar MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    
    // Inicializar servicios
    clienteService = new ClienteService();
    vehiculoService = new VehiculoService();
    tramoService = new TramoService();
    siteService = new SiteService();
    empresaService = new EmpresaService();
    personalService = new PersonalService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar todas las colecciones antes de cada test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('CRUD Operations - Cliente Service', () => {
    const testCliente = {
      nombre: 'Cliente Test',
      cuit: '20-12345678-9',
      activo: true
    };

    it('should create a cliente successfully', async () => {
      const result = await clienteService.create(testCliente);
      
      expect(result).toBeDefined();
      expect(result.nombre).toBe(testCliente.nombre);
      expect(result.cuit).toBe(testCliente.cuit);
      expect(result._id).toBeDefined();
    });

    it('should get cliente by ID', async () => {
      const created = await clienteService.create(testCliente);
      const found = await clienteService.getById(created._id.toString());
      
      expect(found).toBeDefined();
      expect(found!.nombre).toBe(testCliente.nombre);
      expect(found!._id.toString()).toBe(created._id.toString());
    });

    it('should update cliente successfully', async () => {
      const created = await clienteService.create(testCliente);
      const updatedData = { nombre: 'Cliente Actualizado' };
      
      const updated = await clienteService.update(created._id.toString(), updatedData);
      
      expect(updated).toBeDefined();
      expect(updated!.nombre).toBe(updatedData.nombre);
      expect(updated!.cuit).toBe(testCliente.cuit); // Campo no modificado
    });

    it('should delete cliente successfully', async () => {
      const created = await clienteService.create(testCliente);
      const deleted = await clienteService.delete(created._id.toString());
      
      expect(deleted).toBe(true);
      
      const found = await clienteService.getById(created._id.toString());
      expect(found).toBeNull();
    });

    it('should get all clientes with pagination', async () => {
      // Crear múltiples clientes
      await Promise.all([
        clienteService.create({ ...testCliente, nombre: 'Cliente 1' }),
        clienteService.create({ ...testCliente, nombre: 'Cliente 2', cuit: '20-87654321-2' }),
        clienteService.create({ ...testCliente, nombre: 'Cliente 3', cuit: '20-11111111-3' })
      ]);

      const result = await clienteService.getAll({ pagina: 1, limite: 2 });
      
      expect(result.data).toHaveLength(2);
      expect(result.paginacion.total).toBe(3);
      expect(result.paginacion.paginaActual).toBe(1);
      expect(result.paginacion.paginas).toBe(2);
    });
  });

  describe('CRUD Operations - Vehiculo Service', () => {
    const testVehiculo = {
      patente: 'ABC123',
      marca: 'Test Marca',
      modelo: 'Test Modelo',
      año: 2023,
      capacidadCarga: 1000,
      estado: 'activo' as const,
      tipoVehiculo: 'camion' as const
    };

    it('should perform complete CRUD cycle for vehiculo', async () => {
      // Create
      const created = await vehiculoService.create(testVehiculo);
      expect(created.patente).toBe(testVehiculo.patente);
      
      // Read
      const found = await vehiculoService.getById(created._id.toString());
      expect(found).toBeDefined();
      expect(found!.patente).toBe(testVehiculo.patente);
      
      // Update
      const updated = await vehiculoService.update(created._id.toString(), { 
        marca: 'Marca Actualizada' 
      });
      expect(updated!.marca).toBe('Marca Actualizada');
      
      // Delete
      const deleted = await vehiculoService.delete(created._id.toString());
      expect(deleted).toBe(true);
    });
  });

  describe('CRUD Operations - Tramo Service', () => {
    let clienteId: string;
    let origenId: string;
    let destinoId: string;

    beforeEach(async () => {
      // Crear datos de prerequisito
      const cliente = await clienteService.create({
        nombre: 'Cliente para Tramo',
        email: 'cliente@tramo.com',
        telefono: '123456789',
        direccion: 'Dir Cliente',
        activo: true
      });
      clienteId = cliente._id.toString();

      const origen = await siteService.create({
        nombre: 'Origen Test',
        direccion: 'Dir Origen',
        cliente: clienteId,
        coordenadas: { lat: -33.4489, lng: -70.6693 }
      });
      origenId = origen._id.toString();

      const destino = await siteService.create({
        nombre: 'Destino Test',
        direccion: 'Dir Destino',
        cliente: clienteId,
        coordenadas: { lat: -33.4500, lng: -70.6700 }
      });
      destinoId = destino._id.toString();
    });

    it('should create tramo with all relationships', async () => {
      const testTramo = {
        nombre: 'Tramo Test',
        origen: origenId,
        destino: destinoId,
        cliente: clienteId,
        distanciaKm: 15.5,
        tiempoEstimadoMinutos: 30,
        activo: true,
        tarifas: [{
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 86400000), // +1 día
          tarifaBase: 1000,
          formula: 'tarifaBase * distanciaKm'
        }]
      };

      const created = await tramoService.create(testTramo);
      
      expect(created).toBeDefined();
      expect(created.nombre).toBe(testTramo.nombre);
      expect(created.origen.toString()).toBe(origenId);
      expect(created.destino.toString()).toBe(destinoId);
      expect(created.cliente.toString()).toBe(clienteId);
      expect(created.tarifas).toHaveLength(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Crear 50 clientes
      const clientesData = Array.from({ length: 50 }, (_, i) => ({
        nombre: `Cliente Bulk ${i}`,
        cuit: `20-1234567${i.toString().padStart(2, '0')}-${i % 10}`,
        activo: true
      }));

      const createPromises = clientesData.map(data => clienteService.create(data));
      await Promise.all(createPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verificar que se crearon todos
      const result = await clienteService.getAll({ pagina: 1, limite: 100 });
      expect(result.paginacion.total).toBe(50);
      
      // El tiempo debe ser razonable (menos de 5 segundos)
      expect(duration).toBeLessThan(5000);
    });

    it('should paginate large datasets efficiently', async () => {
      // Crear 100 registros
      const clientesData = Array.from({ length: 100 }, (_, i) => ({
        nombre: `Cliente ${i}`,
        cuit: `20-1234567${i.toString().padStart(2, '0')}-${i % 10}`,
        activo: true
      }));

      await Promise.all(clientesData.map(data => clienteService.create(data)));

      // Test paginación
      const page1 = await clienteService.getAll({ pagina: 1, limite: 20 });
      const page5 = await clienteService.getAll({ pagina: 5, limite: 20 });

      expect(page1.data).toHaveLength(20);
      expect(page1.paginacion.paginas).toBe(5);
      expect(page5.data).toHaveLength(20);
      expect(page5.paginacion.paginaActual).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ID gracefully', async () => {
      const result = await clienteService.getById('invalid-id');
      expect(result).toBeNull();
    });

    it('should handle non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await clienteService.getById(fakeId);
      expect(result).toBeNull();
    });

    it('should handle deletion of non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await clienteService.delete(fakeId);
      expect(result).toBe(false);
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle complex workflow: Cliente -> Site -> Tramo', async () => {
      // 1. Crear cliente
      const cliente = await clienteService.create({
        nombre: 'Cliente Workflow',
        cuit: '20-99999999-9',
        activo: true
      });

      // 2. Crear sites para el cliente
      const origen = await siteService.create({
        nombre: 'Origen Workflow',
        direccion: 'Dir Origen',
        cliente: cliente._id.toString(),
        coordenadas: { lat: -33.4489, lng: -70.6693 }
      });

      const destino = await siteService.create({
        nombre: 'Destino Workflow',
        direccion: 'Dir Destino',
        cliente: cliente._id.toString(),
        coordenadas: { lat: -33.4500, lng: -70.6700 }
      });

      // 3. Crear tramo usando cliente y sites
      const tramo = await tramoService.create({
        nombre: 'Tramo Workflow',
        origen: origen._id.toString(),
        destino: destino._id.toString(),
        cliente: cliente._id.toString(),
        distanciaKm: 15.5,
        tiempoEstimadoMinutos: 30,
        activo: true,
        tarifas: [{
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 86400000),
          tarifaBase: 1000,
          formula: 'tarifaBase * distanciaKm'
        }]
      });

      // Verificar que todo está correctamente relacionado
      expect(tramo.cliente.toString()).toBe(cliente._id.toString());
      expect(tramo.origen.toString()).toBe(origen._id.toString());
      expect(tramo.destino.toString()).toBe(destino._id.toString());

      // Verificar que los sites pertenecen al cliente correcto
      const sitesDelCliente = await siteService.getAll({ 
        pagina: 1, 
        limite: 10,
        filtros: { cliente: cliente._id.toString() }
      });
      expect(sitesDelCliente.paginacion.total).toBe(2);
    });
  });
});