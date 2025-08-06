# Guía de Controladores Modulares

## Estructura y Organización

### Patrón Modular Adoptado

Este proyecto utiliza una arquitectura de controladores **modulares** donde cada controlador se organiza en su propia carpeta con archivos individuales para cada operación.

```
backend/controllers/
├── entidad/
│   ├── index.ts           # Exporta todas las funciones
│   ├── createEntidad.ts   # POST - Crear
│   ├── getAllEntidades.ts # GET - Listar todos
│   ├── getEntidadById.ts  # GET - Obtener por ID
│   ├── updateEntidad.ts   # PUT - Actualizar
│   ├── deleteEntidad.ts   # DELETE - Eliminar
│   └── ...                # Operaciones específicas
```

### Ventajas del Patrón Modular

1. **Separación de Responsabilidades**: Cada archivo tiene una única función
2. **Mantenibilidad**: Cambios aislados sin afectar otras operaciones
3. **Testabilidad**: Tests unitarios específicos por operación
4. **Colaboración**: Menos conflictos en control de versiones
5. **Escalabilidad**: Fácil agregar nuevas operaciones

## Convenciones de Nomenclatura

### Archivos de Controlador

- **Operaciones CRUD básicas**:
  - `createEntidad.ts` - Crear nueva entidad
  - `getAllEntidades.ts` - Listar todas las entidades
  - `getEntidadById.ts` - Obtener entidad específica
  - `updateEntidad.ts` - Actualizar entidad existente
  - `deleteEntidad.ts` - Eliminar entidad

- **Operaciones específicas**:
  - `getEntidadesByRelacion.ts` - Filtrar por relación
  - `bulkCreateEntidades.ts` - Creación masiva
  - `getEntidadTemplate.ts` - Obtener plantilla Excel
  - `exportEntidades.ts` - Exportar a Excel/CSV

### Estructura de un Controlador Individual

```typescript
// backend/controllers/vehiculo/createVehiculo.ts
import { Request, Response } from 'express';
import { vehiculoService } from '../../services/vehiculo';
import { ApiResponse } from '../../utils/ApiResponse';
import logger from '../../utils/logger';

/**
 * Crear un nuevo vehículo
 * @route POST /api/vehiculos
 */
const createVehiculo = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehiculoData = req.body;

    // Validación y lógica de negocio
    const nuevoVehiculo = await vehiculoService.create(vehiculoData);

    // Respuesta exitosa
    ApiResponse.success(res, nuevoVehiculo, 'Vehículo creado exitosamente');
  } catch (error) {
    logger.error('Error al crear vehículo:', error);
    ApiResponse.error(res, 'Error al crear vehículo', 500);
  }
};

export default createVehiculo;
```

### Archivo Index Exportador

```typescript
// backend/controllers/vehiculo/index.ts
import createVehiculo from './createVehiculo';
import getAllVehiculos from './getAllVehiculos';
import getVehiculoById from './getVehiculoById';
import updateVehiculo from './updateVehiculo';
import deleteVehiculo from './deleteVehiculo';
// ... más imports

export {
  createVehiculo,
  getAllVehiculos,
  getVehiculoById,
  updateVehiculo,
  deleteVehiculo,
  // ... más exports
};
```

## Migración de Controlador Monolítico a Modular

### Antes (Monolítico)

```typescript
// backend/controllers/vehiculoController.ts ❌
export const getAllVehiculos = async (req: Request, res: Response) => {
  // lógica...
};

export const createVehiculo = async (req: Request, res: Response) => {
  // lógica...
};

export const updateVehiculo = async (req: Request, res: Response) => {
  // lógica...
};
// ... todas las funciones en un solo archivo (500+ líneas)
```

### Después (Modular)

```typescript
// backend/controllers/vehiculo/getAllVehiculos.ts ✅
const getAllVehiculos = async (req: Request, res: Response): Promise<void> => {
  // lógica específica de listar vehículos
};
export default getAllVehiculos;

// backend/controllers/vehiculo/createVehiculo.ts ✅
const createVehiculo = async (req: Request, res: Response): Promise<void> => {
  // lógica específica de crear vehículo
};
export default createVehiculo;
```

## Pasos para Migrar un Controlador

1. **Crear carpeta** con el nombre de la entidad en `controllers/`
2. **Crear archivo individual** para cada función exportada
3. **Mover cada función** a su archivo correspondiente
4. **Convertir exports** a `export default`
5. **Crear index.ts** que importe y re-exporte todas las funciones
6. **Actualizar imports** en archivos de rutas
7. **Verificar tests** y endpoints
8. **Eliminar archivo monolítico** original

## Ejemplo de Migración Completa

### Paso 1: Identificar funciones en controlador monolítico

```bash
# Analizar el archivo original
grep "export const" backend/controllers/siteController.ts
```

### Paso 2: Crear estructura modular

```bash
mkdir backend/controllers/site
touch backend/controllers/site/index.ts
```

### Paso 3: Crear archivos individuales

```bash
# Para cada función identificada
touch backend/controllers/site/createSite.ts
touch backend/controllers/site/getAllSites.ts
# ... etc
```

### Paso 4: Migrar función por función

```typescript
// De: backend/controllers/siteController.ts
export const createSite = async (req, res) => {
  /*...*/
};

// A: backend/controllers/site/createSite.ts
const createSite = async (req: Request, res: Response): Promise<void> => {
  // misma lógica
};
export default createSite;
```

### Paso 5: Actualizar rutas

```typescript
// De:
import { createSite, getAllSites } from '../controllers/siteController';

// A:
import { createSite, getAllSites } from '../controllers/site';
```

## Controladores Actuales Migrados

✅ **Completamente modulares**:

- `auth/` - Autenticación (login, register)
- `cliente/` - Gestión de clientes
- `empresa/` - Gestión de empresas
- `extra/` - Cargos adicionales
- `formulaCliente/` - Fórmulas personalizadas
- `personal/` - Gestión de personal
- `site/` - Gestión de sitios/ubicaciones
- `tramo/` - Gestión de tramos/rutas
- `vehiculo/` - Gestión de vehículos
- `viaje/` - Gestión de viajes

❌ **Pendientes de migración**:

- `proxyController.ts` - Servicio proxy (archivo único por simplicidad)

## Mejores Prácticas

### ✅ DO's (Hacer)

1. **Un archivo por operación**: Mantener separación estricta
2. **Nombres descriptivos**: `getVehiculosByEmpresa.ts` en lugar de `getByEmpresa.ts`
3. **Export default**: Usar export default para la función principal
4. **Tipado completo**: Usar TypeScript para Request, Response y tipos de datos
5. **Manejo de errores**: Usar try-catch y ApiResponse consistente
6. **Logging**: Registrar errores y operaciones importantes
7. **Documentación JSDoc**: Incluir descripción y ruta del endpoint

### ❌ DON'Ts (No hacer)

1. **No mezclar operaciones**: Evitar múltiples endpoints en un archivo
2. **No usar nombres genéricos**: Evitar `handler.ts`, `controller.ts`
3. **No duplicar lógica**: Usar servicios para lógica de negocio
4. **No olvidar validación**: Siempre validar entrada antes de procesar
5. **No hacer imports circulares**: Mantener jerarquía clara

## Testing de Controladores Modulares

### Estructura de Tests

```
backend/__tests__/
├── controllers/
│   ├── vehiculo/
│   │   ├── createVehiculo.test.ts
│   │   ├── getAllVehiculos.test.ts
│   │   └── ...
```

### Ejemplo de Test

```typescript
// backend/__tests__/controllers/vehiculo/createVehiculo.test.ts
import request from 'supertest';
import app from '../../../app';

describe('POST /api/vehiculos', () => {
  it('debe crear un nuevo vehículo', async () => {
    const vehiculoData = {
      patente: 'ABC123',
      marca: 'Toyota',
      modelo: 'Hilux',
    };

    const response = await request(app).post('/api/vehiculos').send(vehiculoData).expect(201);

    expect(response.body.data).toMatchObject(vehiculoData);
  });
});
```

## Conclusión

La arquitectura modular de controladores proporciona una base sólida para el crecimiento y mantenimiento del proyecto. Siguiendo estas convenciones, el código permanece organizado, testeable y fácil de mantener a largo plazo.

Para nuevas funcionalidades, siempre seguir el patrón modular establecido en lugar de crear archivos monolíticos.
