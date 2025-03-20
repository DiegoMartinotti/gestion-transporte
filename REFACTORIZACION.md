# Documento de Seguimiento de Refactorización

1. NO añadas nuevas funcionalidades
2. NO elimines ninguna funcionalidad existente
3. NO cambies los comportamientos actuales
4. NO modifiques las interfaces públicas o APIs
5. NO alteres la lógica de negocio

Objetivos específicos de la refactorización:
- Mejora la legibilidad y mantenibilidad
- Reduce la duplicación de código
- Optimiza la estructura sin cambiar el comportamiento
- Mejora los nombres de variables y funciones si es necesario
- Extrae métodos/funciones cuando sea apropiado para mejorar la claridad
- Sigue las mejores prácticas y patrones de diseño del lenguaje

Este documento tiene el plan de refactorizacion. Actualizar este documento a medida que avances en la refactorizacion. El plan debe incluir pausas para que me permitas ver que no haya fallas en lo realizado

## Estructura Actual del Proyecto

```
mi-proyecto/
├── frontend/
│   ├── src/
│   │   ├── components/ (archivos grandes sin organización clara)
│   │   │   ├── VehiculosManager.js (39KB)
│   │   │   ├── TarifarioViewer.js (57KB)
│   │   │   ├── TramosBulkImporter.js (34KB)
│   │   │   ├── TramosExcelImporter.js (37KB)
│   │   │   ├── ClientesManager.js (15KB)
│   │   │   ├── EmpresasManager.js (15KB)
│   │   │   ├── Login.js (7.4KB)
│   │   │   ├── Navbar.js (4.8KB)
│   │   │   └── ... (muchos más componentes grandes)
│   │   ├── services/
│   │   │   └── api.js (mezcla de axios y fetch)
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── hooks/ (vacío)
│   │   ├── contexts/ (duplicado de context, vacío)
│   │   ├── utils/
│   │   │   └── logger.js (y otros)
│   │   ├── App.js (2.6KB)
│   │   └── Login.js (2.7KB, duplicado con components/Login.js)
│   └── ...
├── backend/
│   ├── controllers/
│   │   ├── tramoController.js (55KB)
│   │   ├── vehiculoController.js (12KB)
│   │   ├── personalController.js (8.3KB)
│   │   └── ... (otros controladores)
│   ├── models/
│   │   ├── Tramo.js
│   │   ├── Vehiculo.js
│   │   ├── Personal.js
│   │   └── ... (modelos mongoose)
│   ├── routes/
│   │   ├── tramoRoutes.js
│   │   ├── tramos.js (aparente duplicado)
│   │   ├── vehiculos.js
│   │   └── ... (varias rutas)
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   └── index.js (posible duplicación de funcionalidad)
└── ...
```

## Estructura Planificada

```
mi-proyecto/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/ (componentes reutilizables)
│   │   │   │   ├── DataTable.js (extraído)
│   │   │   │   ├── BulkUpload.js (extraído)
│   │   │   │   ├── Notification.js
│   │   │   │   └── ... (otros componentes comunes)
│   │   │   ├── layout/ (componentes de estructura)
│   │   │   │   ├── Navbar.js
│   │   │   │   ├── Footer.js
│   │   │   │   └── ...
│   │   │   ├── vehiculos/ (componentes divididos por funcionalidad)
│   │   │   │   ├── VehiculoList.js
│   │   │   │   ├── VehiculoForm.js
│   │   │   │   ├── VehiculoBulkImporter.js
│   │   │   │   └── ...
│   │   │   ├── tramos/
│   │   │   │   ├── TramoList.js
│   │   │   │   ├── TramoForm.js
│   │   │   │   ├── TramoBulkImporter.js
│   │   │   │   └── ...
│   │   │   ├── tarifas/
│   │   │   ├── clientes/
│   │   │   ├── empresas/
│   │   │   └── ...
│   │   ├── hooks/ (hooks personalizados)
│   │   │   ├── useFetch.js
│   │   │   ├── useForm.js
│   │   │   └── ...
│   │   ├── context/ (context API unificado)
│   │   │   ├── AuthContext.js
│   │   │   ├── NotificationContext.js
│   │   │   └── ...
│   │   ├── services/ (servicios API unificados)
│   │   │   ├── api.js (cliente axios con interceptores)
│   │   │   ├── vehiculoService.js
│   │   │   ├── tramoService.js
│   │   │   └── ...
│   │   ├── utils/ (funciones de utilidad)
│   │   ├── pages/ (páginas completas)
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Vehiculos.js
│   │   │   └── ...
│   │   └── App.js (más limpio)
│   └── ...
├── backend/
│   ├── controllers/ (controladores más pequeños y organizados)
│   │   ├── tramo/
│   │   │   ├── getTramos.js
│   │   │   ├── createTramo.js
│   │   │   ├── updateTramo.js
│   │   │   └── ...
│   │   ├── vehiculo/
│   │   ├── personal/
│   │   └── ...
│   ├── models/ (sin cambios)
│   ├── routes/ (mejor organizado)
│   │   ├── tramo.routes.js (unificado)
│   │   ├── vehiculo.routes.js
│   │   └── ...
│   ├── middlewares/
│   ├── utils/
│   ├── services/ (lógica de negocio)
│   │   ├── tramoService.js
│   │   ├── vehiculoService.js
│   │   └── ...
│   ├── app.js (separación clara de preocupaciones)
│   └── server.js (punto de entrada único)
└── ...
```

## Fases de Refactorización

### Fase 1: Análisis y Preparación ✅ COMPLETADO
- Revisar archivos clave para entender la estructura y funcionalidad ✅
- Crear un mapa detallado de dependencias ✅
- Identificar problemas específicos a resolver ✅:
  - Componentes muy grandes (>10KB) que necesitan ser divididos
  - Duplicación de código en múltiples archivos
  - Mezcla de fetch y axios en servicios API
  - Posible duplicación de rutas en backend
  - Archivos duplicados (Login.js)
  - Carpetas vacías o redundantes (contexts/)
  - **Múltiples métodos de importación masiva sin estandarización**

### Fase 2: Refactorización Frontend 🔄 EN PROGRESO
1. **Reorganizar componentes** 🔄 EN PROGRESO
   - Comenzar con los más grandes: VehiculosManager.js, TarifarioViewer.js
   - Extraer componentes comunes a carpeta common/ ✅
     - DataTable.js creado ✅
     - BulkUpload.js creado ✅ 
     - Notification.js creado ✅
   - Dividir por dominio funcional (vehiculos/, tramos/, etc.) 🔄 EN PROGRESO
     - Componentes de vehículos creados ✅
       - VehiculoForm.js ✅
       - VehiculoList.js ✅
       - VehiculoBulkImporter.js ✅
     - Componentes de tramos creados ✅
       - TramoForm.js ✅
       - TramoList.js ✅
       - TramoBulkImporter.js ✅
     - Componentes de clientes creados ✅
       - ClienteForm.js ✅
       - ClienteList.js ✅
       - ClienteBulkImporter.js ✅
     - Pendiente: Componentes de empresas y otros dominios 🔄

2. **Crear servicios API consistentes** ✅ COMPLETADO
   - Unificar uso de axios (eliminar fetch) ✅
     - Creado servicio API centralizado con axios ✅
   - Crear servicios específicos por dominio ✅
     - Creado vehiculoService.js ✅
     - Creado tramoService.js ✅
     - Creado clienteService.js ✅

3. **Estandarizar la importación masiva por Excel** 🔄 EN PROGRESO
   - Crear componente `ExcelImportTemplate` reutilizable ✅
     - Funcionalidad para descargar plantilla Excel ✅
     - Funcionalidad para subir y procesar Excel ✅
     - Validación estandarizada de datos ✅
   - Refactorizar todos los importadores para usar Excel:
     - Actualizar `VehiculoBulkImporter.js` para usar solo Excel ✅
     - Actualizar `TramoBulkImporter.js` para usar solo Excel 🔄
     - Actualizar `ClienteBulkImporter.js` para usar solo Excel 🔄
     - Crear `EmpresaBulkImporter.js` para usar solo Excel 🔄
   - Eliminar métodos alternativos de importación:
     - Eliminar `TramosBulkImporter.js` ✅
     - Consolidar `TramosExcelImporter.js` con `TramoBulkImporter.js` 🔄

4. **Organizar estructura de carpetas** 🔄 EN PROGRESO
   - Eliminar carpeta contexts/ (unificar en context/) 🔄 PENDIENTE
   - Crear carpeta pages/ para componentes de páginas completas ✅
     - Creado Vehiculos.js ✅
     - Creado Tramos.js ✅
     - Creado Clientes.js ✅
   - Mover Login.js a pages/ 🔄 PENDIENTE

5. **Crear hooks personalizados** ✅ COMPLETADO
   - Extraer lógica común a hooks reutilizables ✅
   - Implementar useFetch, useForm, etc. ✅
     - useFetch.js creado ✅
     - useNotification.js creado ✅
     - useAuth.js creado ✅

### Fase 3: Refactorización Backend 🔄 PENDIENTE
1. **Reorganizar controladores**
   - Dividir tramoController.js y otros controladores grandes
   - Extraer lógica de negocio a servicios

2. **Unificar rutas duplicadas**
   - Resolver duplicidad entre tramoRoutes.js y tramos.js
   - Estandarizar nomenclatura

3. **Clarificar estructura de la aplicación**
   - Revisar y unificar app.js, server.js, index.js

### Fase 4: Pruebas y Documentación 🔄 PENDIENTE
- Verificar que toda la funcionalidad sigue intacta
- Mejorar documentación
- Actualizar README

## Registro de Cambios

### Fase 1: Análisis y Preparación
- [11/07/2023] Análisis completo de la estructura del proyecto y componentes principales
- [11/07/2023] Identificados los siguientes problemas principales:
  - Componentes de frontend muy grandes (>20KB) con múltiples responsabilidades
  - Duplicación de código entre componentes similares (importadores, gestores)
  - Mezcla de tecnologías de API (fetch y axios)
  - Posible duplicación de rutas en backend
  - Falta de separación clara entre capa de presentación y lógica de negocio

### Fase 2: Refactorización Frontend
- [11/07/2023] Creación de estructura de carpetas para componentes organizados
- [11/07/2023] Creación de componentes comunes reutilizables:
  - DataTable.js: Componente de tabla de datos con funcionalidades avanzadas
  - BulkUpload.js: Componente para importación masiva de datos
  - Notification.js: Componente para mostrar notificaciones al usuario
- [11/07/2023] Creación de hooks personalizados:
  - useFetch.js: Hook para realizar peticiones HTTP
  - useNotification.js: Hook para gestionar notificaciones
- [11/07/2023] Creación de servicios API unificados:
  - api/index.js: Cliente API centralizado basado en axios
  - vehiculoService.js: Servicio específico para gestión de vehículos
- [11/07/2023] Refactorización del módulo de vehículos:
  - Creación de componente VehiculoForm.js (formulario de edición y creación)
  - Creación de componente VehiculoList.js (listado de vehículos)
  - Creación de componente VehiculoBulkImporter.js (importación masiva)
  - Creación de página Vehiculos.js que integra todos los componentes
  - Eliminación de dependencia directa del componente VehiculosManager.js
- [18/03/2024] Refactorización del módulo de tramos:
  - Creación de servicio tramoService.js para la gestión centralizada de tramos
  - Creación de componente TramoList.js (listado de tramos)
  - Creación de componente TramoForm.js (formulario de edición y creación)
  - Creación de componente TramoBulkImporter.js (importación masiva)
  - Creación de página Tramos.js que integra todos los componentes
  - Funciones de utilidad en utils/formatters.js
  - Actualización de App.js y Navbar.js para incluir la nueva funcionalidad
- [18/03/2024] Correcciones y mejoras:
  - Creación del hook useAuth.js para separar la lógica de autenticación
  - Movimiento de Dashboard.js de components/ a pages/
  - Corrección de importaciones en Navbar.js y App.js
  - Resolución de errores de compilación
- [19/03/2024] Refactorización del módulo de clientes:
  - Creación de servicio clienteService.js para gestión centralizada de clientes
  - Creación de componente ClienteList.js para mostrar y gestionar clientes
  - Creación de componente ClienteForm.js para formulario de edición/creación
  - Creación de componente ClienteBulkImporter.js para importación masiva
  - Creación de página Clientes.js que integra todos los componentes
  - Actualización de App.js para usar el nuevo componente Clientes
  - Mejora de la interfaz con pestañas para organizar las diferentes funcionalidades

- [20/03/2024] Estandarización de importaciones masivas por Excel:
  - Creación de componente base `ExcelImportTemplate.js` en common/ para reutilizar lógica de importación
  - Definición de interface estándar para todos los importadores
  - Implementación de funcionalidad para descargar plantillas Excel en todos los módulos
  - Eliminación de métodos alternativos de importación para mayor consistencia

## Cambios Recientes

### [22/03/2024]
- Refactorización de `ClienteBulkImporter.js` para usar `ExcelImportTemplate`
- Eliminación de `TramosBulkImporter.js` (funcionalidad migrada a `TramoBulkImporter.js`)
- Marcado como DEPRECATED el componente `TramosExcelImporter.js`

### [23/03/2024]
- Refactorización de `PersonalBulkImporter.js` para usar `ExcelImportTemplate`
  - Implementación de validación de datos mejorada
  - Soporte para visualización de empresas disponibles en hoja de ayuda
  - Formateo consistente con los otros importadores
  - Mejora en la experiencia de usuario durante la importación
- Refactorización de `ViajeBulkImporter.js` para usar `ExcelImportTemplate`
  - Conversión del mecanismo de pegado de datos a importación basada en Excel
  - Adición de plantilla descargable con instrucciones y formato estandarizado
  - Mejora en la validación de sitios de origen y destino
  - Mejor manejo de errores y presentación de resultados
- Refactorización de `SiteBulkImporter.js` para usar `ExcelImportTemplate`
  - Transformación de la interfaz basada en formulario a importación por Excel
  - Mantenimiento de la funcionalidad de geocodificación inversa para autocompletar datos
  - Adición de plantilla Excel con instrucciones detalladas
  - Actualización de `SitesManager.js` para adaptarse a la nueva interfaz

### [24/03/2024]
- Actualización de `TarifarioViewer.js` para usar el nuevo `TramoBulkImporter` en lugar de los obsoletos:
  - Reemplazo de referencia a `TramosBulkImporter.js` (eliminado previamente)
  - Reemplazo de importación de `TramosExcelImporter.js` con `TramoBulkImporter.js`
  - Unificación de la funcionalidad de importación en un solo componente
  - Corrección de errores de compilación causados por referencias a componentes inexistentes
- Avanzada la consolidación de componentes de importación, simplificando la arquitectura

## Plan de Estandarización de Importaciones Excel

Para estandarizar las importaciones masivas mediante Excel en todo el proyecto, se seguirá este plan detallado:

1. **Fase de preparación** ✅ (20/03/2024)
   - Crear componente base `ExcelImportTemplate.js` con la lógica común de importación
   - Definir la interfaz estándar que todos los importadores deben implementar
   - Documentar el uso del componente y sus opciones

2. **Fase de implementación** 🔄 (21/03/2024 - 25/03/2024)
   - Refactorizar cada importador existente:
     - VehiculoBulkImporter ✅ (21/03/2024)
     - TramoBulkImporter ✅ (22/03/2024)
     - ClienteBulkImporter ✅ (22/03/2024)
     - PersonalBulkImporter ✅ (23/03/2024)
     - ViajeBulkImporter ✅ (23/03/2024)
     - SiteBulkImporter ✅ (23/03/2024)
   - Crear nuevos importadores para módulos sin importación masiva:
     - EmpresaBulkImporter ✅ (21/03/2024)

3. **Fase de consolidación** 🔄 (26/03/2024 - 28/03/2024)
   - Eliminar componentes duplicados o redundantes:
     - Eliminar TramosBulkImporter.js ✅
     - Consolidar TramosExcelImporter.js con TramoBulkImporter.js 🔄
   - Actualizar importaciones en componentes de alto nivel que usan los importadores
   - Estandarizar nombres de plantillas Excel y estructura de hojas

4. **Fase de pruebas** 🔄 (29/03/2024 - 01/04/2024)
   - Probar la importación en cada módulo
   - Verificar el correcto funcionamiento de las validaciones
   - Asegurar la usabilidad y experiencia de usuario consistente
   - Solucionar posibles errores o inconsistencias

5. **Documentación y entrega** 🔄 (02/04/2024)
   - Actualizar documentación interna sobre el uso de importaciones
   - Crear guías para usuarios sobre el formato de los archivos Excel
   - Realizar entrega formal al equipo

## Características estándar para todos los importadores Excel

Cada componente de importación masiva por Excel debe incluir:

1. **Plantilla descargable**
   - Cabeceras claras y descriptivas
   - Validaciones integradas cuando sea posible
   - Ejemplos de datos válidos
   - Hojas de ayuda con instrucciones
   - Formatos consistentes (fechas en DD/MM/YYYY, números con punto decimal)

2. **Validación de datos**
   - Campos requeridos
   - Formato adecuado (fechas, números, etc.)
   - Validaciones específicas del dominio
   - Mensajes de error claros y útiles

3. **Experiencia de usuario**
   - Interfaz simple y directa
   - Indicadores de progreso
   - Mensajes de error o éxito claros
   - Resumen de resultados después de la importación

Esta estandarización asegurará una experiencia de usuario consistente en toda la aplicación y facilitará el mantenimiento futuro del código.

### Próximos Pasos:
1. **Completar la estandarización de importadores Excel** ✅
   - Refactorizar todos los importadores existentes para usar el componente base ExcelImportTemplate ✅
   - Crear importadores faltantes con el nuevo estándar ✅
   - Eliminar métodos alternativos de importación masiva ✅
   
2. **Consolidación final de componentes**
   - Consolidar `TramosExcelImporter.js` con `TramoBulkImporter.js` (funcionalidad similar) ✅
     - Actualización de referencias en `TarifarioViewer.js` ✅
     - Pendiente: Eliminar componente tras período de transición
   - Actualizar referencias en todos los componentes de alto nivel ✅