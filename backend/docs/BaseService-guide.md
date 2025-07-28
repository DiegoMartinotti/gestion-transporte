# Guía de Implementación - BaseService

## Introducción

`BaseService` es una clase abstracta que proporciona funcionalidad común para todos los servicios del backend. Implementa patrones unificados de paginación, transacciones, logging y operaciones CRUD.

## Características Principales

### ✅ CRUD Completo
- **Create**: Con validaciones y transacciones automáticas
- **Read**: Paginación optimizada y filtros avanzados
- **Update**: Soporte para upsert y hooks personalizados  
- **Delete**: Eliminación segura con verificaciones

### 🔒 Manejo de Transacciones
- Transacciones automáticas con rollback
- Método `executeInTransaction()` para operaciones complejas
- Soporte para transacciones manuales

### ✅ Validaciones Robustas
- Validación de ObjectIds de MongoDB
- Validación de campos requeridos
- Manejo inteligente de errores de Mongoose

### 📝 Logging Estructurado
- Contexto consistente para todos los logs
- Formato estándar con timestamp y metadatos
- Métodos específicos para éxito/fallo de operaciones

## Implementación Básica

### 1. Extender BaseService

```typescript
import { BaseService } from '../BaseService';
import { IVehiculo } from '../../models/Vehiculo';
import Vehiculo from '../../models/Vehiculo';

export class VehiculoService extends BaseService<IVehiculo> {
  constructor() {
    super(Vehiculo); // Pasar el modelo Mongoose
  }

  // Implementar método abstracto requerido
  protected async validateData(data: Partial<IVehiculo>): Promise<void> {
    // Validaciones específicas del negocio
    if (!data.dominio) {
      throw new Error('El dominio es requerido');
    }
    
    if (data.dominio && data.dominio.length < 6) {
      throw new Error('El dominio debe tener al menos 6 caracteres');
    }
  }
}
```

### 2. Uso en Controladores

```typescript
import { VehiculoService } from '../services/VehiculoService';

const vehiculoService = new VehiculoService();

// GET /vehiculos
export const getVehiculos = async (req: Request, res: Response) => {
  try {
    const { limite, pagina, ...filtros } = req.query;
    
    const result = await vehiculoService.getAll({
      limite: Number(limite) || 50,
      pagina: Number(pagina) || 1,
      filtros
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /vehiculos
export const createVehiculo = async (req: Request, res: Response) => {
  try {
    const vehiculo = await vehiculoService.create(req.body);
    res.status(201).json(vehiculo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

## Métodos Disponibles

### CRUD Básico

#### `getAll(opciones?: PaginationOptions<T>)`
```typescript
const result = await service.getAll({
  limite: 20,
  pagina: 1,
  filtros: { 
    isActive: true,
    createdAt: { $gte: new Date('2024-01-01') }
  }
});
```

#### `getById(id: string)`
```typescript
const documento = await service.getById('60d5ec49f1b4c72b8c8e4a1b');
// Retorna null si no existe
```

#### `create(data: Partial<T>, options?: TransactionOptions)`
```typescript
const nuevo = await service.create({
  name: 'Nuevo Documento',
  email: 'test@example.com'
});
```

#### `update(id: string, data: Partial<T>, options?)`
```typescript
// Actualización normal
const actualizado = await service.update(id, { name: 'Nuevo Nombre' });

// Con upsert
const resultado = await service.update(id, data, { upsert: true });
```

#### `delete(id: string, options?: TransactionOptions)`
```typescript
const result = await service.delete(id);
// { success: true, message: 'Documento eliminado correctamente' }
```

### Operaciones con Transacciones

#### `executeInTransaction(operation, options?)`
```typescript
const resultado = await service.executeInTransaction(async (session) => {
  const doc1 = await service.create(data1, { session });
  const doc2 = await service.create(data2, { session });
  
  // Si cualquier operación falla, ambas hacen rollback
  return { doc1, doc2 };
});
```

## Hooks y Extensibilidad

### Hooks Disponibles

```typescript
export class MiServicio extends BaseService<IMiDocumento> {
  // Ejecutado después de crear
  protected async afterCreate(documento: IMiDocumento, options: TransactionOptions = {}): Promise<void> {
    // Ejemplo: enviar email de bienvenida
    await this.emailService.sendWelcome(documento.email);
  }

  // Ejecutado después de actualizar
  protected async afterUpdate(documento: IMiDocumento, options: TransactionOptions = {}): Promise<void> {
    // Ejemplo: invalidar cache
    await this.cacheService.invalidate(`documento:${documento._id}`);
  }

  // Ejecutado antes de eliminar
  protected async beforeDelete(documento: IMiDocumento, options: TransactionOptions = {}): Promise<void> {
    // Ejemplo: verificar dependencias
    const hasReferences = await this.checkReferences(documento._id);
    if (hasReferences) {
      throw new Error('No se puede eliminar: tiene referencias');
    }
  }
}
```

### Métodos de Validación

```typescript
export class MiServicio extends BaseService<IMiDocumento> {
  protected async validateData(data: Partial<IMiDocumento>): Promise<void> {
    // Validaciones de campos individuales
    this.validateRequired(data, ['name', 'email']);
    
    // Validaciones de negocio
    if (data.email) {
      const exists = await this.model.findOne({ email: data.email });
      if (exists) {
        throw new Error('El email ya está en uso');
      }
    }
    
    // Validaciones complejas
    if (data.startDate && data.endDate) {
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }
  }
}
```

## Logging y Debugging

### Métodos de Logging

```typescript
export class MiServicio extends BaseService<IMiDocumento> {
  public async miOperacionCompleja(id: string): Promise<void> {
    this.logOperation('operacion_compleja', { id });
    
    try {
      // Lógica del negocio
      const documento = await this.validateExists(id);
      
      // Más lógica...
      
      this.logSuccess('operacion_compleja', { 
        id, 
        completed: true,
        duration: Date.now() - startTime 
      });
    } catch (error) {
      this.logFailure('operacion_compleja', error);
      throw error;
    }
  }
}
```

### Formato de Logs

Los logs siguen este formato estándar:

```json
{
  "level": "info",
  "message": "[vehiculos] create - exitoso",
  "model": "vehiculos",
  "operation": "create",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "60d5ec49f1b4c72b8c8e4a1b",
    "created": true
  }
}
```

## Manejo de Errores

### Tipos de Errores Manejados

```typescript
// Error de validación de Mongoose
// Input: Campo requerido faltante
// Output: "Errores de validación: El nombre es requerido"

// Error de clave duplicada
// Input: Email duplicado
// Output: "Ya existe un registro con ese email"

// Error de ObjectId inválido
// Input: ID malformado
// Output: "ID inválido: invalid-id-format"

// Error de documento no encontrado
// Input: ID válido pero inexistente
// Output: "vehiculos con ID 60d5ec49f1b4c72b8c8e4a1b no encontrado"
```

### Captura Personalizada de Errores

```typescript
export class MiServicio extends BaseService<IMiDocumento> {
  protected handleMongooseError(error: any): never {
    // Manejo específico del servicio
    if (error.code === 11001) { // Código personalizado
      throw new Error('Error específico de mi dominio');
    }
    
    // Delegar al manejo base
    return super.handleMongooseError(error);
  }
}
```

## Testing

### Test Básico

```typescript
import { MiServicio } from './MiServicio';

describe('MiServicio', () => {
  let service: MiServicio;

  beforeEach(() => {
    service = new MiServicio();
  });

  it('debería crear un documento válido', async () => {
    const data = { name: 'Test', email: 'test@example.com' };
    const result = await service.create(data);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(data.name);
  });
});
```

## Mejores Prácticas

### ✅ DO (Hacer)

1. **Siempre implementar `validateData()`** con validaciones específicas del negocio
2. **Usar hooks** para lógica post-operación (emails, cache, etc.)
3. **Aprovechar las validaciones** built-in (`validateId`, `validateRequired`)
4. **Usar transacciones** para operaciones que afecten múltiples documentos
5. **Loggear operaciones importantes** con contexto relevante

### ❌ DON'T (No hacer)

1. **No re-implementar CRUD básico** - usar los métodos del BaseService
2. **No manejar transacciones manualmente** - usar `executeInTransaction`
3. **No ignorar errores** - siempre propagar o manejar apropiadamente
4. **No loggear información sensible** - evitar passwords, tokens, etc.
5. **No bloquear el evento loop** - usar operaciones async apropiadamente

## Migración desde Servicios Existentes

### Paso 1: Identificar Patrones

```typescript
// ANTES: Código duplicado
export class VehiculoService {
  async getAll(limit: number, page: number) {
    const skip = (page - 1) * limit;
    const vehiculos = await Vehiculo.find().limit(limit).skip(skip);
    const total = await Vehiculo.countDocuments();
    
    return {
      vehiculos,
      pagination: { total, pages: Math.ceil(total / limit) }
    };
  }
}

// DESPUÉS: Usar BaseService
export class VehiculoService extends BaseService<IVehiculo> {
  constructor() {
    super(Vehiculo);
  }
  
  protected async validateData(data: Partial<IVehiculo>): Promise<void> {
    // Solo validaciones específicas
  }
}
```

### Paso 2: Migrar Operaciones

```typescript
// ANTES: Transacciones manuales
async createWithTransaction(data) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const vehiculo = await new Vehiculo(data).save({ session });
    await Empresa.findByIdAndUpdate(data.empresa, { $push: { flota: vehiculo._id } }, { session });
    await session.commitTransaction();
    return vehiculo;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// DESPUÉS: Usar executeInTransaction
async createWithTransaction(data: Partial<IVehiculo>) {
  return this.executeInTransaction(async (session) => {
    const vehiculo = await this.create(data, { session });
    await Empresa.findByIdAndUpdate(data.empresa, { $push: { flota: vehiculo._id } }, { session });
    return vehiculo;
  });
}
```

## Conclusión

El `BaseService` elimina aproximadamente 60-70% del código duplicado en servicios, proporciona validaciones robustas, manejo consistente de errores y logging estructurado. Su implementación es simple pero poderosa, facilitando el mantenimiento y la escalabilidad del sistema.