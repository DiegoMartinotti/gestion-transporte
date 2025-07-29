# Guía de Uso del BaseService

## Descripción General

El `BaseService` es una clase abstracta que proporciona funcionalidad común para todos los servicios del sistema de gestión de transporte. Esta arquitectura elimina la duplicación de código y garantiza consistencia en todas las operaciones CRUD.

## Arquitectura

```typescript
export abstract class BaseService<T extends Document> {
  protected model: Model<T>;
  protected modelName: string;
  
  // Métodos CRUD unificados
  // Manejo de transacciones
  // Logging centralizado
  // Validaciones genéricas
}
```

## Servicios Implementados

### 1. ClienteService
```typescript
import { ClienteService } from '../services/cliente/clienteService';

const clienteService = new ClienteService();

// Crear cliente
const nuevoCliente = await clienteService.create({
  nombre: 'Empresa ABC',
  cuit: '20-12345678-9',
  activo: true
});

// Obtener con paginación
const clientes = await clienteService.getAll({
  pagina: 1,
  limite: 10,
  filtros: { activo: true }
});
```

### 2. VehiculoService
```typescript
import { VehiculoService } from '../services/vehiculo/vehiculoService';

const vehiculoService = new VehiculoService();

// Crear vehículo
const vehiculo = await vehiculoService.create({
  patente: 'ABC123',
  marca: 'Mercedes-Benz',
  modelo: 'Actros',
  año: 2023,
  capacidadCarga: 15000,
  estado: 'activo',
  tipoVehiculo: 'camion'
});

// Métodos específicos de VehiculoService
const vencimientos = await vehiculoService.getVehiculosConVencimientos();
```

### 3. TramoService
```typescript
import { TramoService } from '../services/tramo/tramoService';

const tramoService = new TramoService();

// Crear tramo con tarifas
const tramo = await tramoService.create({
  origen: origenId,
  destino: destinoId,
  cliente: clienteId,
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

// Métodos específicos
const tarifasVigentes = await tramoService.getTarifasVigentes(tramoId);
```

## Interfaces y Tipos

### PaginationOptions
```typescript
interface PaginationOptions<T = any> {
  limite?: number;          // Número de elementos por página (default: 10)
  pagina?: number;          // Página actual (default: 1)
  filtros?: FilterQuery<T>; // Filtros MongoDB
}
```

### PaginationResult
```typescript
interface PaginationResult<T> {
  data: T[];                // Datos de la página actual
  paginacion: {
    total: number;          // Total de elementos
    paginas: number;        // Total de páginas
    paginaActual: number;   // Página actual
    limite: number;         // Elementos por página
  };
}
```

### BulkResult
```typescript
interface BulkResult {
  success: boolean;
  insertados: number;
  actualizados: number;
  errores: Array<{
    index?: number | string;
    message: string;
    code?: number;
    data?: any;
  }>;
}
```

## Métodos Principales

### Operaciones CRUD Básicas

#### create(data: Partial<T>): Promise<T>
Crea un nuevo documento con validaciones automáticas.

```typescript
const cliente = await clienteService.create({
  nombre: 'Nueva Empresa',
  cuit: '20-87654321-9',
  activo: true
});
```

#### getById(id: string): Promise<T | null>
Obtiene un documento por su ID con validación de ObjectId.

```typescript
const cliente = await clienteService.getById('507f1f77bcf86cd799439011');
```

#### getAll(options?: PaginationOptions<T>): Promise<PaginationResult<T>>
Obtiene documentos con paginación y filtros.

```typescript
const result = await clienteService.getAll({
  pagina: 1,
  limite: 20,
  filtros: { activo: true, nombre: /empresa/i }
});

console.log(`Total: ${result.paginacion.total}`);
console.log(`Página ${result.paginacion.paginaActual} de ${result.paginacion.paginas}`);
```

#### update(id: string, data: Partial<T>): Promise<T | null>
Actualiza un documento existente.

```typescript
const clienteActualizado = await clienteService.update('507f1f77bcf86cd799439011', {
  nombre: 'Empresa Actualizada'
});
```

#### delete(id: string): Promise<boolean>
Elimina un documento (eliminación lógica o física según configuración).

```typescript
const eliminado = await clienteService.delete('507f1f77bcf86cd799439011');
```

### Operaciones Avanzadas

#### executeInTransaction(operation, options?): Promise<any>
Ejecuta operaciones dentro de una transacción MongoDB.

```typescript
const resultado = await clienteService.executeInTransaction(async (session) => {
  const cliente = await clienteService.create(datosCliente, { session });
  const site = await siteService.create({ ...datosSite, cliente: cliente._id }, { session });
  return { cliente, site };
});
```

#### validateExists(id: string, session?): Promise<T>
Valida que un documento existe y lo retorna.

```typescript
const cliente = await clienteService.validateExists('507f1f77bcf86cd799439011');
```

## Patrones de Uso

### 1. Crear Nuevo Servicio

Para crear un nuevo servicio que extienda BaseService:

```typescript
import { BaseService } from '../BaseService';
import MyModel, { IMyModel } from '../../models/MyModel';

export class MyService extends BaseService<IMyModel> {
  constructor() {
    super(MyModel, 'mi_entidad');
  }

  // Métodos específicos de la entidad
  async getActiveItems(): Promise<IMyModel[]> {
    this.logOperation('get_active_items', {});
    
    try {
      const items = await this.model.find({ activo: true });
      this.logSuccess('get_active_items', { count: items.length });
      return items;
    } catch (error) {
      this.logFailure('get_active_items', error);
      throw this.handleMongooseError(error);
    }
  }
}
```

### 2. Manejo de Errores

```typescript
try {
  const cliente = await clienteService.create(datosCliente);
} catch (error) {
  if (error.message.includes('E11000')) {
    // Error de duplicación
    console.log('Cliente ya existe');
  } else {
    // Otros errores
    console.error('Error creando cliente:', error.message);
  }
}
```

### 3. Operaciones en Lote

```typescript
// Crear múltiples clientes
const clientesData = [
  { nombre: 'Cliente 1', cuit: '20-11111111-1', activo: true },
  { nombre: 'Cliente 2', cuit: '20-22222222-2', activo: true },
  { nombre: 'Cliente 3', cuit: '20-33333333-3', activo: true }
];

const promesas = clientesData.map(data => clienteService.create(data));
const clientes = await Promise.all(promesas);
```

### 4. Filtros Avanzados

```typescript
// Búsqueda con múltiples criterios
const result = await clienteService.getAll({
  pagina: 1,
  limite: 10,
  filtros: {
    activo: true,
    nombre: { $regex: 'empresa', $options: 'i' },
    createdAt: { $gte: new Date('2024-01-01') }
  }
});
```

## Logging y Monitoreo

El BaseService incluye logging automático de todas las operaciones:

```typescript
// Los logs se generan automáticamente
[2024-07-29T10:30:15.123Z] [INFO] [clientes] create_start {operation: "create", data: {...}}
[2024-07-29T10:30:15.145Z] [INFO] [clientes] create_success {operation: "create", result: {...}}
```

### Niveles de Log
- `INFO`: Operaciones exitosas
- `WARN`: Situaciones que requieren atención
- `ERROR`: Errores y fallos

## Mejores Prácticas

### 1. Usar Transacciones para Operaciones Complejas
```typescript
// ✅ Correcto - Usar transacción para operaciones relacionadas
await clienteService.executeInTransaction(async (session) => {
  const cliente = await clienteService.create(datosCliente, { session });
  const site = await siteService.create(datosSite, { session });
  return { cliente, site };
});

// ❌ Incorrecto - Operaciones separadas sin transacción
const cliente = await clienteService.create(datosCliente);
const site = await siteService.create(datosSite); // Puede fallar dejando cliente huérfano
```

### 2. Validar IDs Antes de Operaciones
```typescript
// ✅ Correcto - Validar existencia
const clienteExistente = await clienteService.validateExists(clienteId);
const site = await siteService.create({ cliente: clienteExistente._id, ...datosSite });

// ❌ Incorrecto - Asumir que existe
const site = await siteService.create({ cliente: clienteId, ...datosSite });
```

### 3. Usar Paginación para Grandes Datasets
```typescript
// ✅ Correcto - Usar paginación
const result = await clienteService.getAll({ pagina: 1, limite: 20 });

// ❌ Incorrecto - Obtener todos los documentos
const todosLosClientes = await clienteService.model.find();
```

### 4. Manejar Errores Apropiadamente
```typescript
// ✅ Correcto - Manejo específico de errores
try {
  const cliente = await clienteService.create(datos);
} catch (error) {
  if (error.message.includes('duplicate')) {
    return { error: 'Cliente ya existe', code: 'DUPLICATE' };
  }
  throw error; // Re-lanzar otros errores
}
```

## Migración de Servicios Legacy

Para migrar un servicio existente a BaseService:

1. **Identificar métodos CRUD básicos** que pueden ser reemplazados
2. **Mantener métodos específicos** de la entidad
3. **Actualizar controladores** para usar los nuevos métodos
4. **Agregar tests** para verificar funcionalidad

```typescript
// Antes (servicio legacy)
class OldClienteService {
  async createCliente(data) { /* implementación específica */ }
  async getClienteById(id) { /* implementación específica */ }
  async getAllClientes() { /* sin paginación */ }
  // ... más métodos duplicados
}

// Después (con BaseService)
class ClienteService extends BaseService<ICliente> {
  constructor() {
    super(Cliente, 'clientes');
  }
  
  // Solo métodos específicos de Cliente
  async getClientesConSitios(): Promise<ICliente[]> {
    return this.model.find().populate('sites');
  }
}
```

## Testing

Ejemplo de test para servicio con BaseService:

```typescript
describe('ClienteService', () => {
  let clienteService: ClienteService;

  beforeEach(() => {
    clienteService = new ClienteService();
  });

  it('should create cliente with BaseService', async () => {
    const clienteData = { nombre: 'Test', cuit: '20-12345678-9', activo: true };
    const cliente = await clienteService.create(clienteData);
    
    expect(cliente.nombre).toBe(clienteData.nombre);
    expect(cliente._id).toBeDefined();
  });

  it('should paginate results', async () => {
    const result = await clienteService.getAll({ pagina: 1, limite: 5 });
    
    expect(result.data).toHaveLength(5);
    expect(result.paginacion.total).toBeGreaterThan(0);
    expect(result.paginacion.paginaActual).toBe(1);
  });
});
```

## Troubleshooting

### Problema: Error de transacciones en desarrollo
```
Transaction numbers are only allowed on a replica set member or mongos
```

**Solución**: En desarrollo, usar MongoDB sin transacciones o configurar replica set.

### Problema: Memoria insuficiente con grandes datasets
**Solución**: Usar paginación y ajustar el límite por defecto.

### Problema: Logs excesivos en producción
**Solución**: Configurar nivel de log apropiado en variables de entorno.

---

Esta guía proporciona una base sólida para trabajar con la arquitectura BaseService. Para casos específicos o dudas adicionales, consultar el código fuente de los servicios implementados.