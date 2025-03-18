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
     - Pendiente: Componentes de tramos y otros dominios

2. **Crear servicios API consistentes** ✅ COMPLETADO
   - Unificar uso de axios (eliminar fetch) ✅
     - Creado servicio API centralizado con axios ✅
   - Crear servicios específicos por dominio ✅
     - Creado vehiculoService.js ✅

3. **Organizar estructura de carpetas** 🔄 EN PROGRESO
   - Eliminar carpeta contexts/ (unificar en context/) 🔄 PENDIENTE
   - Crear carpeta pages/ para componentes de páginas completas ✅
     - Creado Vehiculos.js ✅
   - Mover Login.js a pages/ 🔄 PENDIENTE

4. **Crear hooks personalizados** ✅ COMPLETADO
   - Extraer lógica común a hooks reutilizables ✅
   - Implementar useFetch, useForm, etc. ✅
     - useFetch.js creado ✅
     - useNotification.js creado ✅

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

### Próximos Pasos:
1. Actualizar el componente DataTable.js para corregir las advertencias relacionadas con @tanstack/react-table
2. Continuar la refactorización de otros módulos siguiendo el mismo patrón:
   - Módulo de clientes
   - Módulo de empresas
   - Módulo de personal
   - Módulo de tarifas
3. Iniciar la Fase 3 de refactorización del Backend
   - Reorganizar controladores grandes (especialmente tramoController.js) 