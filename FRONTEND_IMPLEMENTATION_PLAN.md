# Plan de Implementación Frontend - Sistema de Gestión de Transporte

## Resumen Ejecutivo

Este documento detalla la implementación de un frontend moderno usando **Mantine UI** para el Sistema de Gestión de Transporte. El desarrollo seguirá un enfoque incremental, desde componentes básicos hasta funcionalidades complejas, permitiendo pruebas continuas del sistema.

### Características Principales
- **Framework**: React + TypeScript + Mantine UI
- **Tema**: Modo oscuro por defecto con alternancia de tema
- **Componentes**: Reutilizables y consistentes
- **Excel**: Sistema unificado de importación/exportación masiva
- **Plantillas**: Generación automática con campos obligatorios (*)
- **Referencias**: Hojas con datos existentes para completar formularios

## Jerarquía de Datos del Sistema
```
Cliente (base)
├── Site (ubicaciones)
├── Tramo (rutas entre sites)
├── Extra (cargos adicionales)
├── FormulasPersonalizadasCliente (precios custom)
└── Viaje (viajes usando tramos)
    └── OrdenCompra (facturación)

Empresa (base)
├── Personal (empleados/choferes)
└── Vehiculo (flota)

Usuario (autenticación)
ImportacionTemporal (sistema de importación avanzado)
```

---

## FASE 1: FUNDACIÓN Y ARQUITECTURA BASE

### 1.1 Configuración Inicial del Proyecto
- [ ] Crear proyecto React con TypeScript
- [ ] Configurar Mantine UI con tema personalizado
- [ ] Configurar modo oscuro por defecto
- [ ] Configurar routing (React Router)
- [ ] Configurar estado global (Context/Zustand)
- [ ] Configurar cliente HTTP (Axios)
- [ ] Configurar variables de entorno

### 1.2 Componentes Base Reutilizables
- [ ] **LoadingOverlay**: Indicador de carga unificado
- [ ] **ErrorBoundary**: Manejo centralizado de errores
- [ ] **DataTable**: Tabla reutilizable con paginación, filtros, ordenamiento
- [ ] **FormField**: Wrapper para campos de formulario consistentes
- [ ] **DateRangePicker**: Selector de rangos de fecha
- [ ] **SearchInput**: Buscador con debounce
- [ ] **ConfirmModal**: Modal de confirmación reutilizable
- [ ] **NotificationSystem**: Sistema de notificaciones toast

### 1.3 Layout y Navegación
- [ ] **AppShell**: Shell principal con sidebar y header
- [ ] **Navigation**: Menú de navegación con iconos
- [ ] **Header**: Barra superior con usuario y configuraciones
- [ ] **Breadcrumbs**: Navegación contextual
- [ ] **ThemeToggle**: Alternador de tema claro/oscuro

---

## FASE 2: AUTENTICACIÓN Y USUARIOS

### 2.1 Sistema de Autenticación
- [ ] **LoginForm**: Formulario de login con validación
- [ ] **AuthContext**: Contexto de autenticación
- [ ] **ProtectedRoute**: Rutas protegidas
- [ ] **TokenManager**: Gestión de tokens JWT
- [ ] **UserProfile**: Perfil de usuario
- [ ] **LogoutButton**: Botón de cierre de sesión

**Checkpoint 1**: ✅ Sistema base funcional con autenticación

---

## FASE 3: ENTIDADES BASE (Sin Dependencias Complejas)

### 3.1 Gestión de Clientes
- [ ] **ClienteList**: Lista de clientes con búsqueda y filtros
- [ ] **ClienteForm**: Formulario de creación/edición
- [ ] **ClienteCard**: Tarjeta de cliente para vistas
- [ ] **ClienteDetail**: Vista detallada con información completa
- [ ] **ClienteSelector**: Selector reutilizable para otros formularios

### 3.2 Gestión de Empresas
- [ ] **EmpresaList**: Lista de empresas (Propia/Subcontratada)
- [ ] **EmpresaForm**: Formulario con campos específicos por tipo
- [ ] **EmpresaCard**: Tarjeta con información básica
- [ ] **EmpresaDetail**: Vista detallada con flota y personal
- [ ] **EmpresaSelector**: Selector para asignaciones

### 3.3 Gestión de Personal
- [ ] **PersonalList**: Lista de personal con filtros por tipo
- [ ] **PersonalForm**: Formulario con documentación y períodos
- [ ] **PersonalCard**: Tarjeta con foto y datos básicos
- [ ] **PersonalDetail**: Vista detallada con historial
- [ ] **DocumentacionTable**: Tabla de documentos con vencimientos
- [ ] **ChoferSelector**: Selector específico para choferes

**Checkpoint 2**: ✅ Entidades base funcionando con CRUD completo

---

## FASE 4: SISTEMA EXCEL UNIFICADO

### 4.1 Componentes de Importación/Exportación
- [ ] **ExcelUploadZone**: Zona de drag & drop unificada
- [ ] **ExcelTemplateGenerator**: Generador de plantillas base
- [ ] **ExcelValidationReport**: Reporte de validación con errores
- [ ] **ExcelImportProgress**: Barra de progreso para importaciones
- [ ] **ExcelDataPreview**: Vista previa de datos a importar
- [ ] **ReferenceDataSheets**: Generador de hojas de referencia

### 4.2 Plantillas Excel Base
- [ ] **ClienteTemplate**: Plantilla con campos obligatorios marcados (*)
- [ ] **EmpresaTemplate**: Plantilla con tipos de empresa
- [ ] **PersonalTemplate**: Plantilla con documentación requerida
- [ ] **ReferenceSheets**: Hojas con datos de BD existentes

### 4.3 Lógica de Importación
- [ ] **ExcelProcessor**: Procesador central de archivos Excel
- [ ] **ValidationEngine**: Motor de validación por entidad
- [ ] **ErrorRecovery**: Sistema de recuperación de errores
- [ ] **BulkOperations**: Operaciones masivas optimizadas

**Checkpoint 3**: ✅ Sistema Excel funcional para entidades base

---

## FASE 5: UBICACIONES Y GEOCODIFICACIÓN

### 5.1 Gestión de Sites
- [ ] **SiteList**: Lista con filtros por cliente
- [ ] **SiteForm**: Formulario con geocodificación automática
- [ ] **SiteMap**: Mapa interactivo con ubicaciones
- [ ] **SiteSelector**: Selector con búsqueda geográfica
- [ ] **CoordinateInput**: Input para coordenadas manuales
- [ ] **AddressGeocoder**: Geocodificador de direcciones

### 5.2 Integración de Mapas
- [ ] **MapView**: Componente de mapa reutilizable
- [ ] **LocationPicker**: Selector de ubicación en mapa
- [ ] **DistanceCalculator**: Calculadora de distancias
- [ ] **RouteVisuizer**: Visualizador de rutas

**Checkpoint 4**: ✅ Gestión de ubicaciones con mapas funcional

---

## FASE 6: VEHÍCULOS Y DOCUMENTACIÓN

### 6.1 Gestión de Vehículos
- [ ] **VehiculoList**: Lista con filtros por empresa y estado
- [ ] **VehiculoForm**: Formulario con documentación
- [ ] **VehiculoCard**: Tarjeta con estado de documentos
- [ ] **VehiculoDetail**: Vista detallada con historial
- [ ] **DocumentExpiration**: Alertas de vencimientos
- [ ] **VehiculoSelector**: Selector para viajes

### 6.2 Sistema de Documentación
- [ ] **DocumentTable**: Tabla de documentos por vehículo
- [ ] **ExpirationAlerts**: Sistema de alertas automáticas
- [ ] **DocumentUpload**: Subida de archivos de documentos
- [ ] **ExpirationCalendar**: Calendario de vencimientos

**Checkpoint 5**: ✅ Gestión de vehículos con control de documentación

---

## FASE 7: RUTAS Y TARIFAS (SISTEMA COMPLEJO)

### 7.1 Gestión de Tramos
- [ ] **TramoList**: Lista con filtros avanzados
- [ ] **TramoForm**: Formulario con cálculo automático de distancia
- [ ] **TramoDetail**: Vista detallada con historial de tarifas
- [ ] **TarifaHistorial**: Tabla de tarifas históricas
- [ ] **TarifaForm**: Formulario de tarifas con validación temporal
- [ ] **TramoSelector**: Selector para viajes

### 7.2 Sistema de Tarifas
- [ ] **TarifaCalculator**: Calculadora de tarifas en tiempo real
- [ ] **TarifaVersioning**: Control de versiones de tarifas
- [ ] **TarifaConflictDetector**: Detector de conflictos temporales
- [ ] **TipoCalculoSelector**: Selector de métodos de cálculo
- [ ] **TarifaPreview**: Vista previa de cálculos

**Checkpoint 6**: ✅ Sistema de rutas y tarifas funcionando

---

## FASE 8: EXTRAS Y FÓRMULAS PERSONALIZADAS

### 8.1 Gestión de Extras
- [ ] **ExtraList**: Lista de extras por cliente
- [ ] **ExtraForm**: Formulario con vigencia temporal
- [ ] **ExtraCard**: Tarjeta con información de vigencia
- [ ] **ExtraSelector**: Selector múltiple para viajes
- [ ] **ExtraCalculator**: Calculadora de extras

### 8.2 Fórmulas Personalizadas
- [ ] **FormulaEditor**: Editor de fórmulas con MathJS
- [ ] **FormulaValidator**: Validador de sintaxis
- [ ] **FormulaPreview**: Vista previa de cálculos
- [ ] **VariableHelper**: Ayuda para variables disponibles
- [ ] **FormulaHistory**: Historial de fórmulas por cliente

**Checkpoint 7**: ✅ Sistema de extras y fórmulas funcionando

---

## FASE 9: VIAJES (FUNCIONALIDAD PRINCIPAL)

### 9.1 Gestión de Viajes
- [ ] **ViajeList**: Lista con filtros complejos y estado
- [ ] **ViajeForm**: Formulario complejo con cálculos dinámicos
- [ ] **ViajeDetail**: Vista detallada con desglose de costos
- [ ] **ViajeCard**: Tarjeta con información resumida
- [ ] **ViajeTracker**: Seguimiento de estado de viajes

### 9.2 Cálculos Dinámicos
- [ ] **TarifaCalculator**: Calculadora de tarifas en tiempo real
- [ ] **TotalCalculator**: Calculadora de totales con extras
- [ ] **FormulaProcessor**: Procesador de fórmulas personalizadas
- [ ] **CostBreakdown**: Desglose detallado de costos
- [ ] **ViajeValidator**: Validador de datos de viaje

### 9.3 Configuración Multi-Vehículo
- [ ] **VehiculoAssigner**: Asignador de múltiples vehículos
- [ ] **VehicleTypeDetector**: Detector automático de tipo de unidad
- [ ] **ConfigurationPreview**: Vista previa de configuración

**Checkpoint 8**: ✅ Sistema de viajes funcionando completamente

---

## FASE 10: FACTURACIÓN Y ÓRDENES DE COMPRA

### 10.1 Gestión de Órdenes de Compra
- [ ] **OrdenCompraList**: Lista con estados de partida
- [ ] **OrdenCompraForm**: Formulario con asignación de viajes
- [ ] **OrdenCompraDetail**: Vista detallada con viajes asignados
- [ ] **EstadoPartidaIndicator**: Indicador visual de estado
- [ ] **ViajeAssigner**: Asignador de viajes a OC

### 10.2 Sistema de Partidas
- [ ] **PartidaCalculator**: Calculadora automática de estados
- [ ] **PartidaReport**: Reporte de partidas abiertas/cerradas
- [ ] **PaymentTracker**: Seguimiento de pagos
- [ ] **BillingDashboard**: Dashboard de facturación

**Checkpoint 9**: ✅ Sistema de facturación funcionando

---

## FASE 11: SISTEMA DE IMPORTACIÓN AVANZADO

### 11.1 Importación Multi-Etapa
- [ ] **ImportWizard**: Wizard de importación paso a paso
- [ ] **FailureRecovery**: Sistema de recuperación de fallos
- [ ] **ImportProgress**: Progreso detallado de importación
- [ ] **ErrorCorrection**: Interface de corrección de errores
- [ ] **ImportHistory**: Historial de importaciones

### 11.2 Validación Avanzada
- [ ] **CrossEntityValidator**: Validador entre entidades
- [ ] **BusinessRuleValidator**: Validador de reglas de negocio
- [ ] **DataIntegrityChecker**: Verificador de integridad
- [ ] **ConflictResolver**: Resolvedor de conflictos

**Checkpoint 10**: ✅ Sistema de importación avanzado funcionando

---

## FASE 12: DASHBOARD Y REPORTES

### 12.1 Dashboard Principal
- [ ] **MainDashboard**: Dashboard con métricas principales
- [ ] **KPICards**: Tarjetas de indicadores clave
- [ ] **ChartsContainer**: Contenedor de gráficos
- [ ] **QuickActions**: Acciones rápidas principales
- [ ] **RecentActivity**: Actividad reciente

### 12.2 Sistema de Reportes
- [ ] **ReportBuilder**: Constructor de reportes
- [ ] **ReportViewer**: Visualizador de reportes
- [ ] **ExportOptions**: Opciones de exportación
- [ ] **ScheduledReports**: Reportes programados
- [ ] **ReportHistory**: Historial de reportes

**Checkpoint 11**: ✅ Dashboard y reportes funcionando

---

## CONFIGURACIÓN DE DESARROLLO

### Estructura de Carpetas Sugerida
```
src/
├── components/           # Componentes reutilizables
│   ├── base/            # Componentes base (DataTable, FormField, etc.)
│   ├── excel/           # Sistema Excel unificado
│   ├── forms/           # Formularios específicos
│   └── ui/              # Componentes UI puros
├── pages/               # Páginas principales
│   ├── clientes/
│   ├── empresas/
│   ├── personal/
│   ├── sites/
│   ├── tramos/
│   ├── viajes/
│   └── dashboard/
├── hooks/               # Custom hooks
├── context/             # Contextos de estado
├── services/            # Servicios API
├── utils/               # Utilidades
├── types/               # Tipos TypeScript
└── constants/           # Constantes
```

### Stack Tecnológico
- **Framework**: React 18 + TypeScript
- **UI**: Mantine UI v7
- **Routing**: React Router v6
- **Estado**: Context API + useReducer (o Zustand)
- **HTTP**: Axios
- **Formularios**: React Hook Form + Mantine
- **Mapas**: Leaflet + React-Leaflet
- **Excel**: SheetJS (xlsx)
- **Charts**: Recharts o Mantine Charts
- **Testing**: Jest + React Testing Library

### Comandos de Desarrollo
```bash
# Instalación inicial
npm create react-app frontend --template typescript
cd frontend
npm install @mantine/core @mantine/hooks @mantine/form @mantine/dates @mantine/notifications

# Scripts sugeridos
npm run dev          # Desarrollo
npm run build        # Build producción
npm run test         # Tests
npm run lint         # Linting
npm run type-check   # Verificación tipos
```

### Consideraciones de Testing
- [ ] **Unit Tests**: Para componentes base y utilidades
- [ ] **Integration Tests**: Para flujos completos
- [ ] **E2E Tests**: Para casos de uso críticos
- [ ] **Visual Regression**: Para componentes UI

---

## NOTAS DE IMPLEMENTACIÓN

### Patrones de Desarrollo
1. **Composición sobre Herencia**: Usar composición para reutilización
2. **Props Interface**: Definir interfaces claras para todos los componentes
3. **Error Boundaries**: Implementar en cada página principal
4. **Loading States**: Estados de carga consistentes
5. **Empty States**: Estados vacíos informativos

### Optimizaciones de Performance
1. **Code Splitting**: Por rutas y características
2. **Lazy Loading**: Para componentes pesados
3. **Memoization**: Para cálculos complejos
4. **Virtual Scrolling**: Para listas grandes
5. **Image Optimization**: Para mapas y documentos

### Accesibilidad
1. **ARIA Labels**: En todos los componentes interactivos
2. **Keyboard Navigation**: Navegación completa por teclado
3. **Screen Reader**: Compatibilidad con lectores de pantalla
4. **Color Contrast**: Cumplir WCAG 2.1 AA
5. **Focus Management**: Gestión clara del foco

### Internacionalización (Futuro)
1. **i18n Ready**: Preparar strings para traducción
2. **Date/Number Formats**: Formatos localizados
3. **RTL Support**: Soporte para idiomas RTL

---

Este plan permite un desarrollo incremental y testeable, construyendo desde componentes simples hasta funcionalidades complejas, siempre manteniendo la coherencia de la experiencia de usuario y la reutilización de componentes.