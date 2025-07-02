# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MANDATORY: MCP Context7 Consultation

**CRITICAL**: Before writing any code (using Edit, Write, MultiEdit tools), ALWAYS consult MCP Context7 first to get current documentation for the libraries, frameworks, or APIs being used. This ensures code follows latest best practices and correct usage patterns.

## Project Overview

This is a Transportation Management System (Sistema de Gestión de Transporte) - a comprehensive backend REST API for managing transportation logistics including clients, sites, routes, vehicles, trips, and billing. The system is currently undergoing active migration from JavaScript to TypeScript.

## Common Development Commands

```bash
# Development
npm run dev                 # Start development server with nodemon
npm run build              # Compile TypeScript to JavaScript
npm start                  # Run production build
npm run setup-env          # Set up environment configuration

# Environment specific
npm run start-dev          # Set development environment and start
npm run start-prod         # Set production environment and start
```

## TypeScript Migration Status

**IMPORTANT**: This codebase is in active TypeScript migration (Phase 4 of 5 complete):

- ✅ **Complete**: 
  - config/, middleware/, utils/, validators/
  - **All models**: Cliente, Empresa, Extra, Personal, OrdenCompra, Site, Tramo, Usuario, Vehiculo, Viaje, ImportacionTemporal, FormulasPersonalizadasCliente
  - **All main controllers**: authController, clienteController, empresaController, personalController, siteController, tramoController, vehiculoController, viajeController, proxyController, formulaClienteController
- 🟡 **Pending**: services/, routes/, main application files
- ⚠️ **Minor fixes needed**: Some type compatibility issues in controllers (mainly field naming inconsistencies)

When working on files:
- Maintain existing JavaScript functionality during migration
- Follow strict TypeScript configuration in tsconfig.json
- Preserve complex business logic especially in pricing calculations
- Update imports when migrating related files

## Code Architecture

### Backend Structure
```
backend/
├── config/           # Database and app configuration (TypeScript)
├── controllers/      # API route handlers (JavaScript - to migrate)
├── middleware/       # Express middleware (TypeScript)
├── models/          # Mongoose models (mixed JS/TS)
├── routes/          # API endpoints (JavaScript - to migrate)
├── services/        # Business logic layer (JavaScript - to migrate)
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

## Development Notes

- El front (puerto 3000) y el back (puerto 3001) estan siempre en hot reload.
- **IMPORTANTE**: NUNCA usar `npm run build` ya que tarda mucho. Usar `npx tsc --noEmit` para verificación rápida de TypeScript.

- **Error Handling**: Centralized error handling with structured logging
- **Configuration**: Environment-based config in config/ directory  
- **Documentation**: JSDoc comments throughout codebase
- **Modular Design**: Clear separation between routes, controllers, services, and models
- **Formula Calculations**: Uses MathJS for dynamic pricing formulas

When adding new features, follow the existing pattern of routes → controllers → services → models, and ensure proper TypeScript types are added during the ongoing migration.

## Git Workflow

**IMPORTANT**: Always commit changes following best practices:
- Commit after completing logical units of work (e.g., migrating a complete module, fixing a specific issue)
- Commit before major refactoring or risky changes to preserve working state
- Use descriptive commit messages that explain the "why" not just the "what"
- Stage related files together in atomic commits
- Run tests and build verification before committing when possible

Commit frequency guidelines:
- After migrating a complete file or module to TypeScript
- After fixing compilation errors or type issues
- Before starting work on a new component or feature
- When reaching stable milestones during development
- Before making experimental or potentially breaking changes