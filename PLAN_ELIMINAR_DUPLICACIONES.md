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
- [ ] Crear `frontend/src/components/validators/BaseValidator.tsx`
- [ ] Extraer lógica común de `runValidation`
- [ ] Definir interfaz estándar para reglas de validación
- [ ] Implementar manejo de errores centralizado

### 3.2 Refactorizar Validadores Existentes
- [ ] Refactorizar `BusinessRuleValidator` para extender BaseValidator
- [ ] Refactorizar `CrossEntityValidator` para extender BaseValidator
- [ ] Refactorizar `ViajeValidator` para extender BaseValidator
- [ ] Eliminar código duplicado
- [ ] Agregar tests para verificar que las validaciones siguen funcionando
- [ ] Commit: "refactor: unificar validadores con clase base"

## 4. Componentes de Formulario Genéricos

### 4.1 Crear Componente DynamicListField
- [ ] Crear `frontend/src/components/forms/DynamicListField.tsx`
- [ ] Implementar lógica genérica para agregar/eliminar items de lista
- [ ] Soportar diferentes tipos de campos (fecha, texto, select)
- [ ] Agregar validación integrada

### 4.2 Refactorizar PersonalForm
- [ ] Reemplazar `addPeriodoEmpleo` con DynamicListField
- [ ] Reemplazar `addCapacitacion` con DynamicListField
- [ ] Reemplazar `addIncidente` con DynamicListField
- [ ] Verificar que el formulario mantiene toda su funcionalidad
- [ ] Commit: "refactor: usar DynamicListField en PersonalForm"

## 5. Servicios Backend

### 5.1 Crear Servicio Base
- [ ] Crear `backend/services/BaseService.ts`
- [ ] Implementar métodos CRUD genéricos
- [ ] Agregar manejo de errores estándar
- [ ] Incluir logging consistente

### 5.2 Refactorizar Servicios Existentes
- [ ] Identificar servicios con patrones CRUD similares
- [ ] Extender BaseService donde sea apropiado
- [ ] Mantener lógica específica del dominio
- [ ] Agregar tests de integración
- [ ] Commit: "refactor: implementar BaseService para reducir duplicación"

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