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

### 1.1.2 Consolidar Controladores de Sites
- [x] Verificar funcionalidades faltantes en `backend/controllers/site/`
- [x] Migrar funciones faltantes desde `siteController.ts`
- [x] Actualizar importaciones en rutas
- [x] Eliminar `siteController.ts`
- [x] Ejecutar tests de verificación
- [x] Commit: "refactor: consolidar controladores de sites y eliminar duplicación"

### 1.1.3 Consolidar Controladores de Tramos  
- [ ] Verificar funcionalidades faltantes en `backend/controllers/tramo/`
- [ ] Migrar funciones faltantes desde `tramoController.ts`
- [ ] Actualizar importaciones en rutas
- [ ] Eliminar `tramoController.ts`
- [ ] Ejecutar tests de verificación
- [ ] Commit: "refactor: consolidar controladores de tramos y eliminar duplicación"

## 2. Frontend - Hooks Reutilizables

### 2.1 Crear Hook useModal
- [ ] Crear archivo `frontend/src/hooks/useModal.ts`
- [ ] Implementar lógica común: `isOpen`, `openCreate`, `openEdit`, `close`, `selectedItem`
- [ ] Agregar tests unitarios para el hook
- [ ] Documentar el uso del hook con ejemplos

### 2.2 Migrar Páginas a useModal
- [ ] Migrar `VehiculosPage` para usar `useModal`
- [ ] Migrar `ClientesPage` para usar `useModal`
- [ ] Migrar `EmpresasPage` para usar `useModal`
- [ ] Migrar `PersonalPage` para usar `useModal`
- [ ] Migrar `SitesPage` para usar `useModal`
- [ ] Verificar que todas las funcionalidades siguen funcionando
- [ ] Commit: "refactor: implementar useModal hook para eliminar duplicación"

### 2.3 Crear Hook useDataLoader
- [ ] Crear archivo `frontend/src/hooks/useDataLoader.ts`
- [ ] Implementar patrón común: `data`, `loading`, `error`, `loadData`, `refresh`
- [ ] Agregar soporte para paginación
- [ ] Agregar tests unitarios
- [ ] Documentar con ejemplos de uso

### 2.4 Migrar Páginas a useDataLoader
- [ ] Identificar todas las páginas con patrón `loadData`
- [ ] Migrar cada página para usar `useDataLoader`
- [ ] Verificar manejo de errores consistente
- [ ] Commit: "refactor: implementar useDataLoader para centralizar lógica de carga"

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
1. Consolidar controladores de vehículos (impacto inmediato, bajo riesgo)
2. Crear y migrar a useModal (alta duplicación, mejora significativa)

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