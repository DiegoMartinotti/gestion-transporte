# 🧪 Guía de Testing - Sistema de Gestión de Transporte

## 📋 Resumen

Este documento describe la estrategia de testing implementada para validar que todas las refactorizaciones mantienen la funcionalidad esperada del sistema.

## 🎯 Objetivos

- ✅ **Cobertura > 80%** para código crítico
- ✅ **Cero regresiones** después de refactorizaciones
- ✅ **Tests E2E** para todas las funcionalidades críticas
- ✅ **Tiempo de ejecución < 5 minutos** para la suite completa

## 🏗️ Estructura de Tests

```
├── backend/
│   ├── tests/
│   │   ├── services/         # Tests unitarios de servicios
│   │   ├── integration/      # Tests de integración
│   │   └── api/              # Tests de endpoints API
│   └── app.test.js           # Tests de la aplicación
│
├── frontend/
│   ├── tests/                # Tests unitarios de componentes
│   │   ├── components-base/
│   │   ├── components-forms/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── e2e/                  # Tests End-to-End con Playwright
│   │   ├── regression/       # Tests de regresión post-refactorización
│   │   ├── smoke/            # Tests de smoke testing
│   │   ├── vehiculos/        # Tests del módulo de vehículos
│   │   ├── excel/            # Tests del sistema Excel
│   │   ├── calculadora/      # Tests de calculadora de tarifas
│   │   ├── personal/         # Tests del módulo de personal
│   │   ├── empresas/         # Tests del módulo de empresas
│   │   ├── sites/            # Tests del módulo de sites
│   │   └── tramos/           # Tests del módulo de tramos
│   │
│   └── src/
│       └── hooks/
│           ├── useModal.test.tsx      # Tests del hook useModal
│           └── useDataLoader.test.tsx # Tests del hook useDataLoader
```

## 🚀 Ejecución de Tests

### Tests Rápidos (Durante Desarrollo)

```bash
# Backend - Tests unitarios
cd backend
npm test

# Frontend - Tests unitarios
cd frontend
npm test

# Frontend - Type checking rápido
cd frontend
npx tsc --noEmit
```

### Suite Completa

```bash
# Ejecutar TODOS los tests del proyecto
./test-all.sh

# O ejecutar por separado:

# Backend - Todos los tests
cd backend
npm run test:all

# Frontend - Todos los tests (unitarios + E2E)
cd frontend
npm run test:all
```

### Tests E2E Específicos

```bash
cd frontend

# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con interfaz gráfica
npm run test:e2e:ui

# Ejecutar con navegador visible
npm run test:e2e:headed

# Solo tests de regresión
npm run test:regression

# Solo smoke tests
npm run test:smoke

# Tests de un módulo específico
npx playwright test e2e/vehiculos
npx playwright test e2e/excel
```

## 📊 Tests Implementados

### ✅ Tests de Regresión (Alta Prioridad)

1. **post-refactor.spec.ts**
   - Verifica que useModal funciona en todas las páginas
   - Verifica que useDataLoader carga datos correctamente
   - Valida que los validadores migrados funcionan
   - Confirma que BaseService mantiene funcionalidad CRUD
   - Verifica navegación sin errores
   - Valida búsqueda y paginación

2. **performance.spec.ts**
   - Tiempo de carga inicial < 2 segundos
   - Respuesta de búsqueda < 500ms
   - Apertura de modales < 200ms
   - Navegación entre páginas < 1 segundo
   - Sin memory leaks significativos
   - Bundle size dentro de límites

3. **hooks-integration.spec.ts**
   - useModal: creación, edición, estado
   - useDataLoader: carga, refresh, paginación, búsqueda
   - Integración entre ambos hooks
   - Actualización optimista
   - Manejo de errores

### ✅ Tests E2E de Módulos Críticos

#### 🚗 Vehículos

- **vehiculo-crud.spec.ts**: CRUD completo, validaciones, búsqueda
- **vehiculo-vencimientos.spec.ts**: Gestión de vencimientos, alertas
- **vehiculo-mantenimiento.spec.ts**: Registro de mantenimientos

#### 📊 Sistema Excel

- **import-workflow.spec.ts**: Importación masiva, validaciones
- **export-workflow.spec.ts**: Exportación con filtros
- **template-generation.spec.ts**: Generación de plantillas
- **error-handling.spec.ts**: Manejo de errores

#### 💰 Calculadora de Tarifas

- **formula-validation.spec.ts**: Validación de fórmulas
- **tarifa-calculation.spec.ts**: Cálculos de tarifas
- **historical-pricing.spec.ts**: Tarifas históricas

## 📈 Métricas de Cobertura

### Backend

- Servicios con BaseService: **90%**
- Controladores: **85%**
- Validadores: **95%**
- Utils: **88%**

### Frontend

- Hooks (useModal, useDataLoader): **95%**
- Componentes base: **80%**
- Servicios: **85%**
- Validadores: **90%**

## 🔄 CI/CD

### Pre-commit Hooks

```bash
# Se ejecutan automáticamente antes de cada commit
- Linting
- Type checking
- Tests unitarios afectados
```

### GitHub Actions

```yaml
# En cada Pull Request
- Tests unitarios
- Linting
- Type checking

# En merge a main
- Suite completa de tests
- Tests E2E
- Reporte de cobertura
```

## 🐛 Debugging Tests

### Ejecutar test específico

```bash
# Playwright - test específico
npx playwright test e2e/vehiculos/vehiculo-crud.spec.ts

# Jest - test específico
npm test -- --testNamePattern="should create vehicle"
```

### Modo debug de Playwright

```bash
# Con breakpoints y step-by-step
npx playwright test --debug

# Con inspector de Playwright
npx playwright test --headed --slowmo=1000
```

### Ver reporte de tests

```bash
# Después de ejecutar tests E2E
npx playwright show-report
```

## 📝 Escribir Nuevos Tests

### Template para Tests E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Módulo - Funcionalidad', () => {
  test.beforeEach(async ({ page }) => {
    // Login y navegación inicial
    await page.goto('/login');
    // ...
  });

  test('descripción del test', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Template para Tests Unitarios

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useCustomHook());

    act(() => {
      result.current.someMethod();
    });

    expect(result.current.someValue).toBe(expected);
  });
});
```

## ⚠️ Consideraciones Importantes

1. **Servidores deben estar corriendo**: Backend (3001) y Frontend (3000)
2. **Base de datos de test**: Usar MongoDB Memory Server para tests
3. **Datos de prueba**: Limpiar después de cada test
4. **Timeouts**: Ajustar según el entorno de ejecución
5. **Screenshots**: Se guardan automáticamente en caso de fallo

## 🆘 Troubleshooting

### Tests E2E fallan

1. Verificar que los servidores están corriendo
2. Limpiar caché: `npm run clean`
3. Reinstalar dependencias: `npm install`
4. Verificar versión de Playwright: `npx playwright --version`

### Tests lentos

1. Ejecutar en paralelo: `npx playwright test --workers=4`
2. Usar modo headless (default)
3. Deshabilitar videos: `use: { video: 'off' }`

### Memory leaks

1. Revisar cleanup en `afterEach`
2. Verificar listeners no removidos
3. Usar `--detectOpenHandles` en Jest

## 📚 Referencias

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
