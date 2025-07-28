# Ejemplos de Uso - BaseService

## Ejemplos Básicos

### 1. Servicio Simple - Empresa

```typescript
import { BaseService } from '../BaseService';
import Empresa, { IEmpresa } from '../../models/Empresa';

export class EmpresaService extends BaseService<IEmpresa> {
  constructor() {
    super(Empresa);
  }

  protected async validateData(data: Partial<IEmpresa>): Promise<void> {
    this.validateRequired(data, ['nombre', 'tipo']);
    
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }
    
    if (data.cuit && !this.isValidCuit(data.cuit)) {
      throw new Error('CUIT inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidCuit(cuit: string): boolean {
    return /^\d{2}-\d{8}-\d{1}$/.test(cuit);
  }
}
```

### 2. Servicio con Relaciones - Cliente

```typescript
import { BaseService } from '../BaseService';
import Cliente, { ICliente } from '../../models/Cliente';
import Site from '../../models/Site';

export class ClienteService extends BaseService<ICliente> {
  constructor() {
    super(Cliente);
  }

  protected async validateData(data: Partial<ICliente>): Promise<void> {
    this.validateRequired(data, ['nombre', 'email']);
    
    // Validar unicidad de email
    if (data.email) {
      const existingClient = await this.model.findOne({ 
        email: data.email,
        _id: { $ne: data._id } // Excluir el documento actual en updates
      });
      
      if (existingClient) {
        throw new Error('Ya existe un cliente con ese email');
      }
    }
  }

  // Hook: eliminar sitios relacionados
  protected async beforeDelete(cliente: ICliente): Promise<void> {
    const sitesCount = await Site.countDocuments({ Cliente: cliente._id });
    
    if (sitesCount > 0) {
      throw new Error(`No se puede eliminar: el cliente tiene ${sitesCount} sitios asociados`);
    }
  }

  // Método específico del negocio
  async getClientesActivos(opciones = {}) {
    return this.getAll({
      ...opciones,
      filtros: { isActive: true }
    });
  }
}
```

### 3. Servicio con Operaciones Complejas - Viaje

```typescript
import { BaseService, TransactionOptions } from '../BaseService';
import Viaje, { IViaje } from '../../models/Viaje';
import { calcularTarifaTramo } from '../tarifaService';

export class ViajeService extends BaseService<IViaje> {
  constructor() {
    super(Viaje);
  }

  protected async validateData(data: Partial<IViaje>): Promise<void> {
    this.validateRequired(data, ['cliente', 'origen', 'destino', 'fecha']);
    
    // Validar fechas
    if (data.fecha && new Date(data.fecha) < new Date()) {
      throw new Error('La fecha del viaje no puede ser en el pasado');
    }
    
    // Validar que origen y destino sean diferentes
    if (data.origen && data.destino && data.origen.toString() === data.destino.toString()) {
      throw new Error('El origen y destino no pueden ser iguales');
    }
  }

  // Hook: calcular tarifa automáticamente
  protected async afterCreate(viaje: IViaje, options: TransactionOptions = {}): Promise<void> {
    try {
      const tarifa = await calcularTarifaTramo(
        viaje.origen.toString(),
        viaje.destino.toString(),
        viaje.cliente.toString(),
        { fecha: viaje.fecha }
      );
      
      await this.model.findByIdAndUpdate(
        viaje._id,
        { $set: { tarifaCalculada: tarifa } },
        { session: options.session }
      );
      
      this.logInfo('Tarifa calculada automáticamente', { 
        viajeId: viaje._id, 
        tarifa 
      });
    } catch (error) {
      this.logWarn('No se pudo calcular tarifa automáticamente', { 
        viajeId: viaje._id, 
        error: error.message 
      });
    }
  }

  // Operación compleja con transacción
  async crearViajeConDetalles(datosViaje: Partial<IViaje>, detalles: any[]) {
    return this.executeInTransaction(async (session) => {
      // Crear el viaje
      const viaje = await this.create(datosViaje, { session });
      
      // Crear detalles relacionados
      const detallesCreados = await Promise.all(
        detalles.map(detalle => 
          this.crearDetalle({ ...detalle, viajeId: viaje._id }, { session })
        )
      );
      
      this.logSuccess('viaje_con_detalles_creado', {
        viajeId: viaje._id,
        detallesCount: detallesCreados.length
      });
      
      return { viaje, detalles: detallesCreados };
    });
  }

  private async crearDetalle(datos: any, options: TransactionOptions) {
    // Lógica para crear detalle...
    return datos; // Placeholder
  }
}
```

## Ejemplos de Uso en Controladores

### 1. Controller REST Completo

```typescript
import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

const clienteService = new ClienteService();

export class ClienteController {
  // GET /api/clientes
  async getAll(req: Request, res: Response) {
    try {
      const { limite, pagina, buscar, activo } = req.query;
      
      const filtros: any = {};
      if (buscar) {
        filtros.$or = [
          { nombre: { $regex: buscar, $options: 'i' } },
          { email: { $regex: buscar, $options: 'i' } }
        ];
      }
      if (activo !== undefined) {
        filtros.isActive = activo === 'true';
      }
      
      const result = await clienteService.getAll({
        limite: Number(limite) || 50,
        pagina: Number(pagina) || 1,
        filtros
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/clientes/:id
  async getById(req: Request, res: Response) {
    try {
      const cliente = await clienteService.getById(req.params.id);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/clientes
  async create(req: Request, res: Response) {
    try {
      const cliente = await clienteService.create(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/clientes/:id
  async update(req: Request, res: Response) {
    try {
      const cliente = await clienteService.update(req.params.id, req.body);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/clientes/:id
  async delete(req: Request, res: Response) {
    try {
      const result = await clienteService.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### 2. Operaciones Batch

```typescript
export class ClienteController {
  // POST /api/clientes/batch
  async createBatch(req: Request, res: Response) {
    try {
      const { clientes } = req.body;
      
      const results = await clienteService.executeInTransaction(async (session) => {
        const created = [];
        const errors = [];
        
        for (let i = 0; i < clientes.length; i++) {
          try {
            const cliente = await clienteService.create(clientes[i], { session });
            created.push(cliente);
          } catch (error) {
            errors.push({
              index: i,
              data: clientes[i],
              error: error.message
            });
          }
        }
        
        if (errors.length > 0 && created.length === 0) {
          throw new Error('No se pudo crear ningún cliente');
        }
        
        return { created, errors };
      });
      
      res.status(201).json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/clientes/batch
  async deleteBatch(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      
      const results = await clienteService.executeInTransaction(async (session) => {
        const deleted = [];
        const errors = [];
        
        for (const id of ids) {
          try {
            await clienteService.delete(id, { session });
            deleted.push(id);
          } catch (error) {
            errors.push({
              id,
              error: error.message
            });
          }
        }
        
        return { deleted, errors };
      });
      
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Ejemplos de Testing

### 1. Tests de Servicio

```typescript
import { ClienteService } from '../ClienteService';
import Cliente from '../../models/Cliente';

describe('ClienteService', () => {
  let service: ClienteService;

  beforeEach(() => {
    service = new ClienteService();
  });

  describe('validations', () => {
    it('should validate required fields', async () => {
      const invalidData = { nombre: '' };
      
      await expect(service.create(invalidData))
        .rejects.toThrow('Campos requeridos faltantes: email');
    });

    it('should validate email uniqueness', async () => {
      await service.create({
        nombre: 'Cliente 1',
        email: 'test@example.com'
      });

      await expect(service.create({
        nombre: 'Cliente 2',
        email: 'test@example.com' // Email duplicado
      })).rejects.toThrow('Ya existe un cliente con ese email');
    });
  });

  describe('business logic', () => {
    it('should get active clients only', async () => {
      await service.create({ nombre: 'Activo', email: 'activo@test.com', isActive: true });
      await service.create({ nombre: 'Inactivo', email: 'inactivo@test.com', isActive: false });

      const result = await service.getClientesActivos();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].nombre).toBe('Activo');
    });
  });

  describe('hooks', () => {
    it('should prevent deletion when has related sites', async () => {
      const cliente = await service.create({
        nombre: 'Con Sites',
        email: 'sites@test.com'
      });

      // Mock Site.countDocuments to return > 0
      jest.spyOn(require('../../models/Site'), 'countDocuments')
        .mockResolvedValue(2);

      await expect(service.delete(cliente._id.toString()))
        .rejects.toThrow('No se puede eliminar: el cliente tiene 2 sitios asociados');
    });
  });
});
```

### 2. Tests de Integración

```typescript
import request from 'supertest';
import app from '../../app';

describe('Cliente API', () => {
  describe('POST /api/clientes', () => {
    it('should create a valid client', async () => {
      const clientData = {
        nombre: 'Test Client',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/clientes')
        .send(clientData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.nombre).toBe(clientData.nombre);
      expect(response.body.email).toBe(clientData.email);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = { nombre: '' };

      const response = await request(app)
        .post('/api/clientes')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('requeridos');
    });
  });

  describe('GET /api/clientes', () => {
    beforeEach(async () => {
      // Crear datos de prueba
      await request(app).post('/api/clientes').send({ nombre: 'Cliente 1', email: 'c1@test.com' });
      await request(app).post('/api/clientes').send({ nombre: 'Cliente 2', email: 'c2@test.com' });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .query({ limite: 1, pagina: 1 })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.paginacion.total).toBe(2);
      expect(response.body.paginacion.paginas).toBe(2);
    });

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/clientes')
        .query({ buscar: 'Cliente 1' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nombre).toContain('Cliente 1');
    });
  });
});
```

## Ejemplos de Casos de Uso Avanzados

### 1. Servicio con Cache

```typescript
import { BaseService } from '../BaseService';
import { CacheService } from '../CacheService';

export class ProductoService extends BaseService<IProducto> {
  private cacheService = new CacheService();

  async getById(id: string): Promise<IProducto | null> {
    // Intentar obtener del cache primero
    const cached = await this.cacheService.get(`producto:${id}`);
    if (cached) {
      this.logDebug('Cache hit', { id });
      return cached;
    }

    // Si no está en cache, obtener de BD
    const producto = await super.getById(id);
    
    if (producto) {
      await this.cacheService.set(`producto:${id}`, producto, 300); // 5 min TTL
      this.logDebug('Cache miss - stored', { id });
    }

    return producto;
  }

  protected async afterUpdate(producto: IProducto): Promise<void> {
    // Invalidar cache después de actualizar
    await this.cacheService.delete(`producto:${producto._id}`);
    this.logInfo('Cache invalidated after update', { id: producto._id });
  }
}
```

### 2. Servicio con Eventos

```typescript
import { EventEmitter } from 'events';
import { BaseService } from '../BaseService';

export class PedidoService extends BaseService<IPedido> {
  private eventEmitter = new EventEmitter();

  protected async afterCreate(pedido: IPedido): Promise<void> {
    // Emitir evento después de crear pedido
    this.eventEmitter.emit('pedido.creado', {
      pedidoId: pedido._id,
      clienteId: pedido.cliente,
      monto: pedido.total
    });
  }

  protected async afterUpdate(pedido: IPedido): Promise<void> {
    // Emitir evento si cambió el estado
    if (pedido.estado === 'completado') {
      this.eventEmitter.emit('pedido.completado', {
        pedidoId: pedido._id,
        fecha: new Date()
      });
    }
  }

  // Método para suscribirse a eventos
  onPedidoCreado(callback: (data: any) => void) {
    this.eventEmitter.on('pedido.creado', callback);
  }

  onPedidoCompletado(callback: (data: any) => void) {
    this.eventEmitter.on('pedido.completado', callback);
  }
}
```

### 3. Servicio con Validaciones Asíncronas

```typescript
import { BaseService } from '../BaseService';
import axios from 'axios';

export class EmpresaService extends BaseService<IEmpresa> {
  protected async validateData(data: Partial<IEmpresa>): Promise<void> {
    // Validaciones síncronas primero
    this.validateRequired(data, ['nombre', 'cuit']);

    // Validación asíncrona: verificar CUIT en AFIP
    if (data.cuit) {
      const isValidCuit = await this.validateCuitWithAFIP(data.cuit);
      if (!isValidCuit) {
        throw new Error('CUIT no válido según AFIP');
      }
    }

    // Validación asíncrona: verificar unicidad
    if (data.nombre) {
      const existing = await this.model.findOne({
        nombre: data.nombre,
        _id: { $ne: data._id }
      });
      
      if (existing) {
        throw new Error('Ya existe una empresa con ese nombre');
      }
    }
  }

  private async validateCuitWithAFIP(cuit: string): Promise<boolean> {
    try {
      this.logDebug('Validating CUIT with AFIP', { cuit });
      
      const response = await axios.get(`https://api.afip.gob.ar/cuit/${cuit}`, {
        timeout: 5000
      });
      
      return response.data.valid === true;
    } catch (error) {
      this.logWarn('AFIP validation failed', { cuit, error: error.message });
      // En caso de error de conectividad, permitir la operación
      return true;
    }
  }
}
```

## Conclusión

Estos ejemplos muestran la versatilidad y potencia del `BaseService`. Permite implementar desde servicios simples hasta casos de uso complejos con cache, eventos y validaciones asíncronas, siempre manteniendo el código limpio y consistente.