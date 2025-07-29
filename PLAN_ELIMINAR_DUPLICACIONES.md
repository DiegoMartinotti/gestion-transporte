# Plan de Eliminación de Duplicaciones de Código

## Objetivo
Eliminar código duplicado identificado en el proyecto para mejorar la mantenibilidad, reducir errores y seguir el principio DRY (Don't Repeat Yourself).

## 1. Backend - Controladores Duplicados

### 1.1 Consolidar Controladores de Vehículos
- [x] Verificar que `backend/controllers/vehiculo/` tiene todas las funcionalidades de `vehiculoController.ts`
- [x] Actualizar todas las importaciones en `backend/routes/vehiculos.ts` para usar los controladores modulares
- [x] Eliminar `backend/controllers/vehiculoController.ts`
- [x] Ejecutar tests para verificar que todo funciona correctamente
- [x] Commit: "refactor: consolidar controladores de vehículos y eliminar duplicación"

### 1.2 Revisar Otros Controladores
- [x] Buscar si hay más controladores con el mismo patrón (archivo único vs carpeta modular)
- [ ] Documentar la estrategia a seguir (modular vs archivo único)
- [ ] Aplicar la misma consolidación si se encuentran más casos

#### Controladores Duplicados Encontrados:
- **Site**: `siteController.ts` (357 líneas) vs `site/` (carpeta modular parcial)
- **Tramo**: `tramoController.ts` (1595 líneas) vs `tramo/` (carpeta modular parcial)

#### Archivos de Rutas Duplicados Encontrados:
- **Tramos**: `tramoRoutes.ts` (3768 bytes) vs `tramo.routes.ts` (2234 bytes) vs `tramos.ts` (19271 bytes)
- **Sites**: `site.routes.ts` vs `sites.ts`
- **Vehículos**: `vehiculo.routes.ts` vs `vehiculos.ts`

### 1.1.2 Consolidar Controladores de Sites
- [x] Verificar funcionalidades faltantes en `backend/controllers/site/`
- [x] Migrar funciones faltantes desde `siteController.ts`
- [x] Actualizar importaciones en rutas
- [x] Eliminar `siteController.ts`
- [x] Ejecutar tests de verificación
- [x] Commit: "refactor: consolidar controladores de sites y eliminar duplicación"

### 1.1.3 Consolidar Controladores de Tramos  
- [x] Verificar funcionalidades faltantes en `backend/controllers/tramo/`
- [x] Migrar funciones faltantes desde `tramoController.ts`
- [x] Actualizar importaciones en rutas
- [x] Eliminar `tramoController.ts`
- [x] Ejecutar tests de verificación
- [x] Commit: "refactor: consolidar controladores de tramos y eliminar duplicación"

### 1.4 Consolidar Archivos de Rutas Duplicados

### 1.4.1 Consolidar Rutas de Tramos
- [x] Verificar funcionalidades en los 3 archivos: `tramoRoutes.ts`, `tramo.routes.ts`, `tramos.ts`
- [x] Identificar el archivo principal (probablemente `tramos.ts` por su tamaño)
- [x] Migrar funciones faltantes al archivo principal
- [x] Actualizar importaciones en `backend/routes/index.ts`
- [x] Eliminar archivos duplicados: `tramoRoutes.ts` y `tramo.routes.ts`
- [x] Verificar que todas las rutas funcionan correctamente
- [x] Commit: "refactor: consolidar rutas de tramos y eliminar duplicación"

### 1.4.2 Consolidar Rutas de Sites
- [x] Verificar funcionalidades en `site.routes.ts` vs `sites.ts`
- [x] Identificar el archivo principal
- [x] Migrar funciones faltantes al archivo principal
- [x] Actualizar importaciones en `backend/routes/index.ts`
- [x] Eliminar archivo duplicado
- [x] Verificar que todas las rutas funcionan correctamente
- [x] Commit: "refactor: consolidar rutas de sites y eliminar duplicación"

### 1.4.3 Consolidar Rutas de Vehículos
- [x] Verificar funcionalidades en `vehiculo.routes.ts` vs `vehiculos.ts`
- [x] Identificar el archivo principal
- [x] Migrar funciones faltantes al archivo principal
- [x] Actualizar importaciones en `backend/routes/index.ts`
- [x] Eliminar archivo duplicado
- [x] Verificar que todas las rutas funcionan correctamente
- [x] Commit: "refactor: consolidar rutas de vehículos y eliminar duplicación"

### 1.5 Limpiar Referencias Obsoletas
- [x] Verificar que no queden referencias a `vehiculoController.ts` en el código
- [x] Actualizar `backend/services/excelTemplateService.ts` línea 1447-1510 para usar controladores modulares
- [x] Actualizar referencia a `siteController` (línea 1339) para usar controlador modular
- [x] Actualizar referencia a `personalController` (línea 1407) para usar estructura modular
- [x] Buscar y eliminar otras referencias a controladores eliminados
- [x] Migrar funciones faltantes de site.controller.ts (getSiteById, geocodeDireccion, reprocessAddressesByCliente)
- [x] Eliminar archivo monolítico site.controller.ts después de migración completa
- [x] Commit: "refactor: limpiar referencias a controladores eliminados"

## 2. Frontend - Hooks Reutilizables

### 2.1 Crear Hook useModal
- [x] Crear archivo `frontend/src/hooks/useModal.ts`
- [x] Implementar lógica común: `isOpen`, `openCreate`, `openEdit`, `close`, `selectedItem`
- [x] Agregar tests unitarios para el hook
- [x] Documentar el uso del hook con ejemplos

### 2.2 Migrar Páginas a useModal
- [x] Migrar `VehiculosPage` para usar `useModal` (ya estaba hecho)
- [x] Migrar `ClientesPage` para usar `useModal`
- [x] Migrar `EmpresasPage` para usar `useModal`
- [x] Migrar `PersonalPage` para usar `useModal`
- [x] Migrar `SitesPage` para usar `useModal`
- [x] Migrar `TramosPage` para usar `useModal` (adicional)
- [x] Verificar que todas las funcionalidades siguen funcionando
- [x] Commit: "refactor: implementar useModal hook para eliminar duplicación"

### 2.3 Crear Hook useDataLoader
- [x] Crear archivo `frontend/src/hooks/useDataLoader.ts`
- [x] Implementar patrón común: `data`, `loading`, `error`, `loadData`, `refresh`
- [x] Agregar soporte para paginación
- [x] Agregar tests unitarios
- [x] Documentar con ejemplos de uso

### 2.4 Migrar Páginas a useDataLoader
- [x] Identificar todas las páginas con patrón `loadData`
- [x] Migrar ClientesPage para usar `useDataLoader`
- [x] Migrar TramosPage para usar `useDataLoader`
- [x] Migrar VehiculosPage para usar `useDataLoader`
- [x] Migrar PersonalPage para usar `useDataLoader`
- [x] Verificar manejo de errores consistente
- [x] Validar funcionamiento con Playwright tests
- [x] Commit: "refactor: implementar useDataLoader para centralizar lógica de carga"

### 2.4.1 Completar Migración de Páginas Restantes
- [x] Migrar EmpresasPage para usar useDataLoader (alta prioridad)
- [x] Migrar OrdenesCompraPage para usar useDataLoader (alta prioridad)
- [x] Migrar SitesPage para usar useDataLoader (múltiples loaders)
- [x] Migrar ExtrasPage para usar useDataLoader (tabs + doble carga)
- [x] Migrar ViajesPage para usar useDataLoader (consistencia)
- [x] Validar todas las páginas migradas con Playwright
- [ ] Commit: "refactor: completar migración de todas las páginas a useDataLoader"

## 3. Validadores Unificados

### 3.1 Crear Clase Base para Validadores
- [x] Crear `frontend/src/components/validators/BaseValidator.tsx`
- [x] Extraer lógica común de `runValidation`
- [x] Definir interfaz estándar para reglas de validación
- [x] Implementar manejo de errores centralizado

### 3.2 Refactorizar Validadores Existentes

### 3.2.1 Migrar FormulaValidator (Simple - 1-2 horas)
- [x] Refactorizar `FormulaValidator` para extender BaseValidator
- [x] Actualizar importaciones en `FormulaForm.tsx`
- [x] Verificar funcionalidad con tests
- [x] Commit: "refactor: migrar FormulaValidator a BaseValidator"

### 3.2.2 Migrar CrossEntityValidator (Medio - 3-4 horas) ✅
- [x] Refactorizar `CrossEntityValidator` para extender BaseValidator
- [x] Extraer reglas cross-entity al método `getValidationRules()`
- [x] Adaptar validaciones de relaciones entre entidades
- [x] Verificar funcionalidad con tests
- [x] Commit: "refactor: migrar CrossEntityValidator a BaseValidator"

### 3.2.3 Migrar BusinessRuleValidator (Complejo - 4-5 horas) ✅
- [x] Refactorizar `BusinessRuleValidator` para extender BaseValidator
- [x] Convertir reglas de negocio al formato estándar
- [x] Adaptar validaciones por categoría
- [x] Mantener configuración dinámica de reglas
- [x] Verificar funcionalidad con tests
- [x] Commit: "refactor: migrar BusinessRuleValidator a BaseValidator"

### 3.2.4 Migrar ViajeValidator (Complejo - 5-6 horas)
- [x] Refactorizar `ViajeValidator` para extender BaseValidator
- [x] Dividir 12 reglas en categorías lógicas
- [x] Adaptar validaciones específicas de viajes
- [x] Mantener lógica de compatibilidad cliente-tramo
- [x] Verificar funcionalidad con tests
- [x] Commit: "refactor: migrar ViajeValidator a BaseValidator"

### 3.2.5 Migrar DocumentValidatorGeneric (Muy Complejo - 6-8 horas)
- [x] **Fase A**: Migrar reglas básicas de validación
- [x] **Fase B**: Adaptar sistema de configuración avanzada
- [x] **Fase C**: Mantener funcionalidad de múltiples vistas y modos
- [x] Verificar toda la funcionalidad con tests exhaustivos
- [x] Commit: "refactor: migrar DocumentValidatorGeneric a BaseValidator"

### 3.2.6 Finalizar Migración y Documentación (1 hora) ✅
- [x] Actualizar `ExampleValidatorUsage.tsx` con nuevos patrones
- [x] Eliminar código duplicado identificado
- [x] Agregar documentación de uso del BaseValidator
- [x] Verificar que todos los validadores siguen funcionando
- [x] Commit: "refactor: completar unificación de validadores con BaseValidator"

## 4. Componentes de Formulario Genéricos

### 4.1 Crear Componente DynamicListField
- [x] Crear `frontend/src/components/forms/DynamicListField.tsx`
- [x] Implementar lógica genérica para agregar/eliminar items de lista
- [x] Soportar diferentes tipos de campos (fecha, texto, select)
- [x] Agregar validación integrada

### 4.2 Refactorizar PersonalForm
- [x] Reemplazar `addPeriodoEmpleo` con DynamicListField
- [x] Reemplazar `addCapacitacion` con DynamicListField
- [x] Reemplazar `addIncidente` con DynamicListField
- [x] Verificar que el formulario mantiene toda su funcionalidad
- [x] Commit: "refactor: usar DynamicListField en PersonalForm"

## 5. Servicios Backend

### 5.1 Crear Servicio Base

#### 5.1.1 Análisis de Patrones Comunes ✅
- [x] **5.1.1.1** Revisar `tramoService.ts` para identificar métodos CRUD repetidos
- [x] **5.1.1.2** Revisar `vehiculoService.ts` para identificar patrones de paginación
- [x] **5.1.1.3** Documentar patrones de transacciones y logging encontrados

#### 5.1.2 Crear Estructura Base ✅
- [x] **5.1.2.1** Crear estructura base de `backend/services/BaseService.ts`
- [x] **5.1.2.2** Definir interfaces TypeScript para paginación y resultados
- [x] **5.1.2.3** Crear clase abstracta `BaseService<T>` con generics
- [x] **5.1.2.4** Implementar constructor que recibe el modelo Mongoose

#### 5.1.3 Implementar Métodos CRUD Genéricos ✅
- [x] **5.1.3.1** `getAll()` con soporte para paginación y filtros
- [x] **5.1.3.2** `getById()` con validación de ID y logging mejorado
- [x] **5.1.3.3** `create()` con validaciones y transacciones automáticas
- [x] **5.1.3.4** `update()` con verificación de existencia y soporte upsert
- [x] **5.1.3.5** `delete()` con manejo seguro de referencias y hooks

#### 5.1.4 Agregar Manejo de Errores Estándar ✅
- [x] **5.1.4.1** Método `executeInTransaction()` para operaciones con rollback
- [x] **5.1.4.2** Validaciones genéricas (`validateId`, `validateExists`, `validateRequired`)
- [x] **5.1.4.3** Manejo consistente de errores Mongoose (`handleMongooseError`)

#### 5.1.5 Incluir Logging Consistente ✅
- [x] **5.1.5.1** Métodos protegidos `logOperation()`, `logSuccess()`, `logFailure()`
- [x] **5.1.5.2** Formato estándar para logs con contexto y timestamp
- [x] **5.1.5.3** Integración completa con el sistema de logger existente

#### 5.1.6 Testing y Documentación ✅
- [x] **5.1.6.1** Crear tests unitarios completos para BaseService
- [x] **5.1.6.2** Tests para métodos CRUD genéricos y validaciones
- [x] **5.1.6.3** Tests para manejo de transacciones y rollback
- [x] **5.1.6.4** Configuración Jest + MongoDB Memory Server

#### 5.1.7 Documentación del BaseService ✅
- [x] **5.1.7.1** JSDoc completo para todos los métodos
- [x] **5.1.7.2** Guía completa de implementación (`BaseService-guide.md`)
- [x] **5.1.7.3** Ejemplos prácticos de uso (`BaseService-examples.md`)

### 5.2 Refactorizar Servicios Existentes

#### 5.2.1 Migrar VehiculoService ✅
- [x] **5.2.1.1** Migrar `vehiculoService.ts` a BaseService
  - [x] Crear `VehiculoService extends BaseService<IVehiculo>`
  - [x] Migrar métodos CRUD básicos al BaseService
  - [x] Mantener métodos específicos (`getVehiculosConVencimientos`, `createVehiculosBulk`)
- [x] **5.2.1.2** Actualizar controladores de vehículos
  - [x] Verificar que controladores modulares funcionen con el nuevo servicio
  - [x] Mantener compatibilidad con APIs existentes
- [x] **5.2.1.3** Ejecutar tests de regresión
  - [x] Verificar que todas las funcionalidades de vehículos sigan funcionando
  - [x] Validar endpoints de API con Postman/tests automatizados
- [x] **5.2.1.4** Commit parcial: "refactor: migrar VehiculoService a BaseService"

#### 5.2.2 Migrar TramoService ✅
- [x] **5.2.2.1** Crear `TramoService extends BaseService<ITramo>`
  - [x] Migrar operaciones CRUD básicas
  - [x] Mantener lógica específica (`bulkImportTramos`, `getTarifasVigentes`, `createTramosBulk`)
  - [x] Preservar la compleja lógica de tarifas históricas
- [x] **5.2.2.2** Actualizar controladores de tramos
  - [x] Verificar compatibilidad con controladores modulares existentes
  - [x] Mantener todas las funcionalidades de importación Excel
- [x] **5.2.2.3** Tests específicos para TramoService
  - [x] Verificar cálculos de tarifas
  - [x] Validar importaciones masivas
  - [x] Tests de conflictos de fechas

#### 5.2.3 Identificar y Migrar Otros Servicios ✅
- [x] **5.2.3.1** Auditar servicios existentes
  - [x] Revisar `geocodingService.ts` - no necesita BaseService (servicio externo)
  - [x] Revisar `formulaClienteService.ts` - evaluar si aplica BaseService
  - [x] Revisar `tarifaService.ts` - candidato para BaseService
  - [x] Revisar `excelTemplateService.ts` - servicio utilitario, no aplica
- [x] **5.2.3.2** Crear servicios faltantes con BaseService
  - [x] `ClienteService extends BaseService<ICliente>`
  - [x] `SiteService extends BaseService<ISite>`
  - [x] `EmpresaService extends BaseService<IEmpresa>`
  - [x] `PersonalService extends BaseService<IPersonal>`

### 5.3 Integración y Testing
- [ ] **5.3.1** Tests de integración end-to-end
  - [ ] Verificar que todos los endpoints funcionen correctamente
  - [ ] Validar operaciones CRUD en cada entidad migrada
  - [ ] Tests de rendimiento para operaciones con paginación
- [ ] **5.3.2** Actualizar documentación
  - [ ] Actualizar README con ejemplos del nuevo BaseService
  - [ ] Documentar patrones de extensión para nuevos servicios
  - [ ] Guía de migración para futuros desarrolladores
- [ ] **5.3.3** Commit final: "refactor: completar implementación de BaseService para todos los servicios"

### 5.4 Limpieza y Optimización
- [ ] **5.4.1** Eliminar código duplicado restante
  - [ ] Verificar que no queden métodos CRUD duplicados
  - [ ] Consolidar validaciones comunes
  - [ ] Unificar patrones de logging
- [ ] **5.4.2** Optimizaciones de rendimiento
  - [ ] Revisar queries Mongoose generados por BaseService
  - [ ] Optimizar paginación para grandes datasets
  - [ ] Agregar índices de base de datos si es necesario
- [ ] **5.4.3** Verificación final
  - [ ] Ejecutar todos los tests del proyecto
  - [ ] Verificar que no hay regresiones
  - [ ] Validar que el bundle size no se haya incrementado significativamente

**Estimación Total**: ~3-4 horas de trabajo, dividido en sesiones de 30-45 minutos por subtarea.

## 6. Validación y Testing

### 6.1 Tests de Regresión
- [ ] Ejecutar suite completa de tests después de cada refactorización mayor
- [ ] Crear tests E2E para funcionalidades críticas si no existen
- [ ] Documentar cualquier cambio en comportamiento

### 6.2 Code Review
- [ ] Revisar cada PR con el equipo
- [ ] Verificar que no se introduce nueva duplicación
- [ ] Actualizar documentación según sea necesario

## 7. Documentación y Guías

### 7.1 Actualizar Documentación
- [ ] Documentar nuevos hooks en README del frontend
- [ ] Documentar estructura de controladores modulares
- [ ] Crear guía de estilo para evitar futuras duplicaciones

### 7.2 Configurar Herramientas
- [ ] Configurar ESLint rules para detectar duplicación
- [ ] Agregar pre-commit hooks para análisis de código
- [ ] Configurar CI/CD para rechazar PRs con alta duplicación

## Priorización

### Alta Prioridad (Hacer primero)
1. ~~Consolidar controladores de vehículos~~ ✅ Completado
2. Consolidar archivos de rutas duplicados (impacto inmediato, bajo riesgo)
3. Limpiar referencias obsoletas (crítico para estabilidad)
4. Crear y migrar a useModal (alta duplicación, mejora significativa)

### Media Prioridad
3. Crear useDataLoader
4. Unificar validadores

### Baja Prioridad (Hacer cuando haya tiempo)
5. DynamicListField
6. BaseService
7. Herramientas y documentación

## Métricas de Éxito

- [ ] Reducción del 50% en líneas de código duplicado
- [ ] Todos los tests pasan después de refactorización
- [ ] Tiempo de desarrollo de nuevas features reducido en 30%
- [ ] Cero regresiones introducidas

## Notas

- Cada item debe ser un PR separado para facilitar revisión
- Hacer commit frecuentemente para poder revertir si es necesario
- Mantener comunicación con el equipo sobre cambios grandes
- El Memory Guard ayudará a prevenir nueva duplicación

---

Fecha de inicio: ___________
Fecha estimada de finalización: ___________
Responsable: ___________