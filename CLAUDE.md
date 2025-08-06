# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MANDATORY: Style Guide Compliance

**CRITICAL**: ALWAYS follow the project's style guide located at `docs/STYLE_GUIDE.md`. This guide enforces:

- DRY (Don't Repeat Yourself) principles
- SOLID design patterns
- Anti-duplication patterns
- Code reusability through hooks, base services, and modular controllers

Before creating ANY new code, verify it doesn't duplicate existing functionality.

## MANDATORY: MCP Context7 Consultation

**CRITICAL**: Before writing any code (using Edit, Write, MultiEdit tools), ALWAYS consult MCP Context7 first to get current documentation for the libraries, frameworks, or APIs being used. This ensures code follows latest best practices and correct usage patterns.

## MANDATORY: Proactive Use of Specialized Agents

**CRITICAL**: ALWAYS use specialized agents proactively for tasks matching their expertise. The project has 15 configured agents:

### Global Agents (in ~/.claude/agents/):

- **typescript-pro**: TypeScript development and type safety
- **react-pro**: React patterns and hooks
- **backend-architect**: Node.js/Express architecture
- **database-optimizer**: MongoDB query optimization
- **test-automator**: Jest/Playwright testing
- **code-reviewer**: SOLID/DRY principles review
- **api-documenter**: Swagger and API documentation
- **performance-engineer**: Performance optimization
- **legacy-modernizer**: Code refactoring
- **security-auditor**: Security validation

### Project-Specific Agents (in .claude/agents/):

- **transport-business-expert**: Transportation logic, tariffs, formulas (uses MongoDB MCP)
- **excel-specialist**: Excel operations with BaseExcelService
- **geocoding-routes-expert**: Geocoding and route calculations (uses WebFetch)
- **mantine-ui-expert**: Mantine UI components and patterns (uses Playwright MCP)
- **mongodb-atlas-specialist**: Direct MongoDB operations (uses MongoDB MCP tools)

**Usage**: Invoke agents using the Task tool when their expertise matches the current task. Multiple agents can work concurrently on different aspects of a problem.

## Project Overview

This is a Transportation Management System (Sistema de Gestión de Transporte) - a comprehensive full-stack application for managing transportation logistics including clients, sites, routes, vehicles, trips, and billing. The system consists of a REST API backend (Node.js/Express/TypeScript) and a modern React frontend.

### Quick Start

```bash
# Terminal 1: Backend (port 3001)
cd backend && npm run dev

# Terminal 2: Frontend (port 3000)
cd frontend && npm start

# TypeScript check
npx tsc --noEmit
```

Both servers run in hot-reload mode. Access the app at http://localhost:3000

## TypeScript

When working on files:

- Follow strict TypeScript configuration in tsconfig.json
- Preserve complex business logic especially in pricing calculations

## Code Architecture

### Backend Structure

```
backend/
├── config/           # Database and app configuration (TypeScript)
├── controllers/      # API route handlers (TypeScript)
├── middleware/       # Express middleware (TypeScript)
├── models/          # Mongoose models (TypeScript)
├── routes/          # API endpoints (TypeScript)
├── services/        # Business logic layer (TypeScript)
├── utils/           # Helper functions (TypeScript)
└── validators/      # Input validation (TypeScript)
```

### Core Domain Models

**Transportation Hierarchy**: Cliente → Site → Tramo → Viaje

- **Cliente**: Companies that need transportation services
- **Site**: Physical locations belonging to clients (with geocoding)
- **Tramo**: Route segments between sites for specific clients with pricing rules
- **Viaje**: Individual trips using tramos with complex pricing calculations
- **Vehiculo**: Vehicle configurations supporting multiple trucks per trip

### Key Business Logic Areas

1. **Complex Pricing System**:
   - Historical tariffs with versioning
   - Custom formulas per client using MathJS
   - Multiple calculation methods (distance, weight, time)
   - Extra charges and modifications

2. **Geocoding Integration**:
   - Proxy service for location lookups
   - Distance calculations between sites
   - Rate-limited external API calls

3. **Excel Import/Export**:
   - Bulk operations with custom templates
   - Data transformation and validation
   - Historical data preservation

## API Structure

Main endpoints follow RESTful patterns:

- `/api/auth` - JWT authentication
- `/api/clientes` - Client management
- `/api/sites` - Location management with geocoding
- `/api/tramos` - Route segments with complex pricing
- `/api/viajes` - Trip management and calculations
- `/api/vehiculos` - Vehicle fleet management
- `/api/extras` - Additional charges
- `/api-docs` - Swagger documentation

## Security & Rate Limiting

- JWT authentication with configurable expiration
- Rate limiting: 100 req/15min general, 10 req/min for geocoding proxy
- Input validation using custom validators (TypeScript)
- CORS and security headers configured

## Database (MongoDB)

Using Mongoose ODM with:

- Complex relationships between transportation entities
- Historical data preservation for pricing
- Geospatial indexing for location data
- Custom validation and middleware

## Frontend Stack

- **React 18** + TypeScript + Mantine UI
- **Features**: Dark theme, Excel system, real-time validation
- **Details**: Ver `/frontend/README.md` para documentación completa

## Development Notes

- El front (puerto 3000) y el back (puerto 3001) estan siempre en hot reload.
- **IMPORTANTE**: NUNCA usar `npm run build` ya que tarda mucho. Usar `npx tsc --noEmit` para verificación rápida de TypeScript.

- **Error Handling**: Centralized error handling with structured logging
- **Configuration**: Environment-based config in config/ directory
- **Documentation**: JSDoc comments throughout codebase
- **Modular Design**: Clear separation between routes, controllers, services, and models
- **Formula Calculations**: Uses MathJS for dynamic pricing formulas

When adding new features, follow the existing pattern of routes → controllers → services → models, and ensure proper TypeScript types are added during the ongoing migration.

## Frontend Development Principles

### Component Reusability

**CRITICAL**: Always prioritize component reusability and avoid code duplication:

1. **Common UI Components**: Use existing base components in `src/components/base/` (DataTable, LoadingOverlay, SearchInput, etc.)
2. **Shared Hooks**: Leverage custom hooks for common functionality (useExcelOperations, useSearch, etc.)
3. **Unified Services**: Use BaseExcelService for all Excel operations instead of duplicating code
4. **Centralized Systems**:
   - Excel operations: useExcelOperations + BaseExcelService
   - Import/Export: Unified modal and processing system
   - Validation: Shared validation engines and components

### Required Patterns to Follow

#### Frontend Patterns

- **Modal Management**: ALWAYS use `useModal` hook for modal states
- **Data Loading**: ALWAYS use `useDataLoader` hook for data fetching with loading/error states
- **Forms**: Use DynamicListField for repeating form sections
- **Validation**: Extend BaseValidator for new validators

#### Backend Patterns

- **Controllers**: Use modular pattern (one file per operation) in `controllers/entity/` folders
- **Services**: ALWAYS extend BaseService for CRUD operations
- **Validation**: Centralize in validators folder, not in controllers/services
- **Error Handling**: Use ApiResponse utility for consistent responses

### Excel System Architecture

The frontend has a unified Excel system that MUST be used for all import/export operations:

- **Hook**: `useExcelOperations` - Centralizes export, template, and import handling
- **Service**: `BaseExcelService` - Provides consistent API for all entities
- **Components**: ExcelImportModal, ExcelUploadZone, ExcelTemplateGenerator, etc.
- **Never duplicate** Excel functionality in individual pages or services

### Before Creating New Components

1. Check if a similar component already exists in the codebase
2. Verify if existing components can be extended or configured for your needs
3. Look for patterns in similar pages/features that can be abstracted
4. Always run `npx tsc --noEmit` after changes to ensure type safety

## Acceso MongoDB MCP

Claude Code tiene acceso directo a la base de datos MongoDB Atlas del proyecto a través del servidor MCP de MongoDB configurado.

## Capacidades disponibles:

- **Conexión**: MongoDB Atlas Cluster0
- **Base de datos**: `test` (base principal)
- **Colecciones**: clientes, sites, tramos, viajes, vehiculos, empresas, personals, etc.
- **Operaciones**: Consultas, inserción, actualización, eliminación, agregaciones, índices

## Estado: Conectado y operativo

- Servidor configurado en .claude.json
- Permisos habilitados en settings.local.json
- Conexión verificada exitosamente

Usar herramientas mcp**mongodb**\* para interactuar directamente con la BD.
