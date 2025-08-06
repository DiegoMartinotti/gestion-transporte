# Guía de Estilo - Prevención de Duplicación de Código

## Principios Fundamentales

### 1. DRY (Don't Repeat Yourself)

Cada pieza de conocimiento debe tener una representación única, inequívoca y autoritativa dentro del sistema.

### 2. SOLID

- **S**ingle Responsibility: Una clase/función = una responsabilidad
- **O**pen/Closed: Abierto para extensión, cerrado para modificación
- **L**iskov Substitution: Las subclases deben ser sustituibles por sus clases base
- **I**nterface Segregation: Interfaces específicas mejor que generales
- **D**ependency Inversion: Depender de abstracciones, no de concreciones

### 3. KISS (Keep It Simple, Stupid)

La solución más simple que resuelve el problema es la mejor solución.

## Patrones Aprobados vs Anti-Patrones

### ✅ Patrones Aprobados

#### Frontend

##### 1. Hooks Reutilizables

```typescript
// ✅ BIEN: Hook reutilizable
const modal = useModal<Entity>({
  onSuccess: () => loadData(),
});

// Uso consistente en toda la app
modal.openCreate();
modal.openEdit(item);
```

##### 2. Componentes Base

```typescript
// ✅ BIEN: Extender componente base
<DataTable
  data={items}
  columns={columns}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

##### 3. Servicios Centralizados

```typescript
// ✅ BIEN: Un servicio por entidad
import { vehiculoService } from '@/services';

const vehiculos = await vehiculoService.getAll();
const vehiculo = await vehiculoService.getById(id);
```

#### Backend

##### 1. Controladores Modulares

```typescript
// ✅ BIEN: Un archivo por operación
// backend/controllers/vehiculo/createVehiculo.ts
const createVehiculo = async (req: Request, res: Response) => {
  // lógica específica
};
export default createVehiculo;
```

##### 2. Servicios con BaseService

```typescript
// ✅ BIEN: Heredar de BaseService
class VehiculoService extends BaseService<IVehiculo> {
  constructor() {
    super(Vehiculo);
  }

  // Solo métodos específicos de vehículo
  async getVehiculosConVencimientos() {
    /*...*/
  }
}
```

##### 3. Validadores Unificados

```typescript
// ✅ BIEN: Extender BaseValidator
class ViajeValidator extends BaseValidator {
  getValidationRules() {
    return [
      // reglas específicas de viaje
    ];
  }
}
```

### ❌ Anti-Patrones a Evitar

#### Frontend

##### 1. Estado de Modal Duplicado

```typescript
// ❌ MAL: Código duplicado en cada página
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);
const [deleteModalOpen, setDeleteModalOpen] = useState(false);

const handleEdit = (item) => {
  setSelectedItem(item);
  setIsOpen(true);
};
```

##### 2. Lógica de Carga Duplicada

```typescript
// ❌ MAL: Patrón repetido en cada página
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const loadData = async () => {
  setLoading(true);
  try {
    const result = await service.getAll();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

##### 3. Componentes Casi Idénticos

```typescript
// ❌ MAL: Componentes separados para casos similares
<VehiculoCard vehiculo={vehiculo} />
<ClienteCard cliente={cliente} />
<EmpresaCard empresa={empresa} />
// Si la estructura es 90% igual, usar un componente genérico
```

#### Backend

##### 1. Controladores Monolíticos

```typescript
// ❌ MAL: Todas las operaciones en un archivo
// backend/controllers/vehiculoController.ts (500+ líneas)
export const getAllVehiculos = async () => {
  /*...*/
};
export const createVehiculo = async () => {
  /*...*/
};
export const updateVehiculo = async () => {
  /*...*/
};
// ... 20 funciones más
```

##### 2. Servicios con CRUD Duplicado

```typescript
// ❌ MAL: Reimplementar CRUD en cada servicio
class VehiculoService {
  async getAll() {
    /* lógica repetida */
  }
  async getById(id) {
    /* lógica repetida */
  }
  async create(data) {
    /* lógica repetida */
  }
  async update(id, data) {
    /* lógica repetida */
  }
  async delete(id) {
    /* lógica repetida */
  }
}
```

##### 3. Validaciones Dispersas

```typescript
// ❌ MAL: Validaciones duplicadas en múltiples lugares
// En controlador
if (!req.body.nombre) throw new Error('Nombre requerido');

// En servicio
if (!data.nombre) throw new Error('Nombre requerido');

// En modelo
nombre: { type: String, required: true }
```

## Checklist Antes de Escribir Código Nuevo

### 🔍 Paso 1: Buscar Existente

- [ ] ¿Existe un hook que haga esto?
- [ ] ¿Hay un componente base que pueda extender?
- [ ] ¿Existe un servicio que ya maneje esta lógica?
- [ ] ¿Hay un validador similar que pueda reutilizar?

### 🤔 Paso 2: Evaluar Similitud

- [ ] ¿Es este código 70%+ similar a algo existente?
- [ ] ¿Puedo parametrizar una función existente?
- [ ] ¿Puedo crear una abstracción reutilizable?

### 🏗️ Paso 3: Refactorizar si es Necesario

- [ ] ¿Debo extraer lógica común a un hook?
- [ ] ¿Debo crear un componente base?
- [ ] ¿Debo usar composición en lugar de duplicación?

### ✅ Paso 4: Implementar

- [ ] Seguir convenciones de nomenclatura
- [ ] Documentar con JSDoc/TSDoc
- [ ] Agregar tests unitarios
- [ ] Actualizar documentación si es necesario

## Ejemplos de Refactorización

### Ejemplo 1: Extraer Hook Común

#### Antes (Duplicado)

```typescript
// ClientesPage.tsx
const [clientes, setClientes] = useState([]);
const [loading, setLoading] = useState(false);
const loadClientes = async () => {
  /*...*/
};

// VehiculosPage.tsx
const [vehiculos, setVehiculos] = useState([]);
const [loading, setLoading] = useState(false);
const loadVehiculos = async () => {
  /*...*/
};
```

#### Después (Refactorizado)

```typescript
// useDataLoader.ts
export const useDataLoader = <T>({ fetchFunction }) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const result = await fetchFunction();
    setData(result);
    setLoading(false);
  };

  return { data, loading, refresh };
};

// ClientesPage.tsx
const {
  data: clientes,
  loading,
  refresh,
} = useDataLoader({
  fetchFunction: clienteService.getAll,
});

// VehiculosPage.tsx
const {
  data: vehiculos,
  loading,
  refresh,
} = useDataLoader({
  fetchFunction: vehiculoService.getAll,
});
```

### Ejemplo 2: Crear Servicio Base

#### Antes (Duplicado)

```typescript
// VehiculoService.ts
class VehiculoService {
  async getAll() {
    try {
      const result = await Vehiculo.find();
      return result;
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
  }
}

// ClienteService.ts
class ClienteService {
  async getAll() {
    try {
      const result = await Cliente.find();
      return result;
    } catch (error) {
      logger.error('Error:', error);
      throw error;
    }
  }
}
```

#### Después (Refactorizado)

```typescript
// BaseService.ts
abstract class BaseService<T> {
  constructor(protected model: Model<T>) {}

  async getAll() {
    try {
      const result = await this.model.find();
      return result;
    } catch (error) {
      logger.error(`Error in ${this.model.modelName}:`, error);
      throw error;
    }
  }
}

// VehiculoService.ts
class VehiculoService extends BaseService<IVehiculo> {
  constructor() {
    super(Vehiculo);
  }
}

// ClienteService.ts
class ClienteService extends BaseService<ICliente> {
  constructor() {
    super(Cliente);
  }
}
```

### Ejemplo 3: Componente Genérico

#### Antes (Duplicado)

```tsx
// VehiculoForm.tsx
const VehiculoForm = ({ vehiculo, onSubmit }) => {
  const [formData, setFormData] = useState(vehiculo || {});
  // 100 líneas de lógica de formulario
};

// ClienteForm.tsx
const ClienteForm = ({ cliente, onSubmit }) => {
  const [formData, setFormData] = useState(cliente || {});
  // 100 líneas de lógica similar
};
```

#### Después (Refactorizado)

```tsx
// GenericForm.tsx
const GenericForm = <T,>({ entity, fields, onSubmit, validationRules }) => {
  const [formData, setFormData] = useState<T>(entity || ({} as T));
  // Lógica común de formulario

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <FormField key={field.name} {...field} />
      ))}
    </form>
  );
};

// VehiculoForm.tsx
const VehiculoForm = (props) => (
  <GenericForm
    entity={props.vehiculo}
    fields={vehiculoFields}
    onSubmit={props.onSubmit}
    validationRules={vehiculoRules}
  />
);
```

## Herramientas de Detección

### ESLint Rules Recomendadas

```json
{
  "rules": {
    "no-duplicate-imports": "error",
    "no-identical-functions": "error",
    "sonarjs/no-duplicate-string": ["error", 3],
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-duplicated-branches": "error",
    "sonarjs/cognitive-complexity": ["error", 15]
  }
}
```

### Análisis de Duplicación

```bash
# Detectar código duplicado con jscpd
npx jscpd . --min-lines 5 --min-tokens 50

# Análisis con SonarQube
sonar-scanner -Dsonar.sources=./src
```

## Proceso de Review

### En Pull Requests

1. **Verificar duplicación**: ¿El código nuevo duplica algo existente?
2. **Sugerir reutilización**: Indicar componentes/hooks/servicios existentes
3. **Proponer abstracción**: Si hay patrón repetido, sugerir crear abstracción
4. **Documentar decisión**: Si se acepta duplicación temporal, documentar por qué

### Refactoring Continuo

- **Regla del 3**: Si algo se repite 3 veces, es momento de abstraer
- **Refactor Friday**: Dedicar tiempo semanal a eliminar duplicación
- **Debt Tracking**: Mantener lista de duplicaciones conocidas para refactorizar

## Recursos Adicionales

- [Clean Code - Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [Refactoring - Martin Fowler](https://refactoring.com/)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

## Conclusión

La eliminación de duplicación no es solo sobre menos código, es sobre:

- **Mantenibilidad**: Un solo lugar para cambiar
- **Consistencia**: Comportamiento uniforme
- **Calidad**: Menos bugs por inconsistencias
- **Velocidad**: Desarrollo más rápido con componentes reutilizables

Siguiendo esta guía, mantenemos un código base limpio, eficiente y fácil de evolucionar.
