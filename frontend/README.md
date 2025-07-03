# Frontend - Sistema de Gestión de Transporte

## Descripción
Frontend desarrollado con React + TypeScript + Mantine UI para el sistema de gestión de transporte.

## Tecnologías Principales
- **React 18** con TypeScript
- **Mantine UI v8.1** - Component library con tema oscuro
- **React Router v7** - Routing client-side
- **Axios** - Cliente HTTP con interceptors
- **React Hook Form** - Manejo de formularios
- **Recharts/Nivo** - Visualización de datos

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── base/       # Componentes core (DataTable, forms, etc.)
│   │   ├── forms/      # Formularios específicos por entidad
│   │   ├── cards/      # Cards para entidades
│   │   ├── excel/      # Componentes import/export Excel
│   │   ├── modals/     # Modales de diálogo
│   │   ├── selectors/  # Selectores/dropdowns de entidades
│   │   ├── calculators/ # Calculadoras de tarifas
│   │   ├── maps/       # Componentes de mapas
│   │   ├── reports/    # Generación de reportes
│   │   └── ...         # Otros componentes especializados
│   ├── pages/          # Componentes de páginas/rutas
│   ├── services/       # Servicios API y lógica de negocio
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # Contextos React (Auth, etc.)
│   ├── types/          # Definiciones TypeScript
│   └── utils/          # Funciones helper
├── tests/              # Archivos de prueba
└── public/             # Assets estáticos
```

## Páginas Implementadas

### Gestión Principal
- **Dashboard**: KPIs, gráficos, actividad reciente
- **Clientes**: CRUD completo con Excel import/export
- **Sites**: Gestión de ubicaciones con geocodificación
- **Tramos**: Configuración de rutas con pricing
- **Viajes**: Gestión de viajes con cálculos complejos

### Recursos y Configuración
- **Vehículos**: Gestión de flota con tracking de documentos
- **Personal**: Gestión de empleados/choferes
- **Empresas**: Gestión de compañías
- **Extras**: Configuración de cargos adicionales
- **Calculadora**: Calculadora independiente de precios

### Herramientas
- **Importación**: Sistema unificado para todas las entidades
- **Reports**: Herramientas de exportación y análisis

## Características Clave

### Sistema Excel Unificado
- **Hook**: `useExcelOperations` - Centraliza export, template e import
- **Service**: `BaseExcelService` - API consistente para todas las entidades
- **Componentes**: ExcelImportModal, ExcelUploadZone, ExcelTemplateGenerator
- **Plantillas**: Generación automática con campos obligatorios (*)
- **Referencias**: Hojas con datos existentes para completar formularios

### Diseño y UX
- **Tema Oscuro**: Por defecto con alternador claro/oscuro
- **Responsive**: Interfaces mobile-friendly
- **Lazy Loading**: Code splitting para performance
- **Validación en Tiempo Real**: Reglas de negocio client-side
- **Type Safety**: Cobertura completa de TypeScript

## Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Crear build de producción
npm run build

# Ejecutar pruebas
npm test

# Verificación rápida de TypeScript
npx tsc --noEmit
```

## Acceso
- **URL**: http://localhost:3000
- **Puerto**: 3000 (con hot-reload)
- **Backend**: Conecta a API en puerto 3001

## Autenticación
Sistema JWT con contexto React, rutas protegidas y gestión automática de tokens.