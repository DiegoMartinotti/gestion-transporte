# Plan de Implementación de Pruebas Automatizadas para el Backend

## 1. Objetivo

El objetivo de este plan es establecer una suite de pruebas automatizadas robusta para el backend del proyecto. La falta de pruebas representa un riesgo crítico para la estabilidad de la aplicación, ya que cualquier cambio puede introducir regresiones (errores en funcionalidades existentes) que pasen desapercibidas hasta llegar a producción.

Implementar pruebas nos proporcionará:

-   **Confianza:** Para refactorizar y añadir nuevas funcionalidades sin miedo a romper el código existente.
-   **Velocidad:** Al automatizar la verificación de la funcionalidad, reducimos drásticamente el tiempo de prueba manual.
-   **Calidad:** Al forzarnos a cubrir casos de uso y casos límite, la calidad y robustez del código aumentará.
-   **Documentación Viva:** Las pruebas sirven como ejemplos de cómo debe usarse la API.

## 2. Herramientas Seleccionadas

Utilizaremos un stack de pruebas estándar y muy popular en el ecosistema de TypeScript/Node.js:

-   **Jest:** Es el framework de pruebas principal. Proporciona el motor para ejecutar las pruebas, realizar aserciones (verificar que los resultados son los esperados) y generar reportes de cobertura.
-   **Supertest:** Es una librería para probar endpoints de API HTTP. Nos permite simular peticiones a nuestros controladores de Express y verificar las respuestas (status code, body, headers) de una manera muy sencilla y legible.
-   **ts-jest:** Es un pre-procesador que permite a Jest ejecutar pruebas escritas en TypeScript directamente, sin necesidad de compilar el código manualmente.

## 3. Plan de Acción Detallado

### Paso 1: Instalación de Dependencias de Desarrollo

El primer paso es añadir las herramientas necesarias al `package.json` del backend.

```bash
cd backend
npm install --save-dev jest supertest ts-jest @types/jest @types/supertest
```

### Paso 2: Creación del Archivo de Configuración de Jest

Crearemos un archivo `jest.config.js` en el directorio `backend/` para indicarle a Jest cómo debe ejecutarse.

**`backend/jest.config.js`**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  verbose: true,
  forceExit: true, // Asegura que Jest se cierre correctamente
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1' // Si usas alias en tsconfig
  }
};
```

### Paso 3: Actualización de `package.json`

Modificaremos el script `test` en `backend/package.json` para que ejecute Jest.

```json
"scripts": {
  "start": "node dist/server.js",
  "dev": "nodemon server.ts",
  "build": "tsc",
  "test": "jest",
  "test:watch": "jest --watchAll",
  "test:coverage": "jest --coverage"
},
```

### Paso 4: Escribir la Primera Prueba de Integración

Crearemos una prueba para un endpoint sencillo que no requiera autenticación, por ejemplo, un endpoint de "health check" o de estado. Si no existe, lo crearemos.

**Ejemplo: `backend/__tests__/app.test.ts`**

```typescript
import request from 'supertest';
import app from '../app'; // Importamos la instancia de la app de Express
import mongoose from 'mongoose';

// Describimos el conjunto de pruebas
describe('API de Gestión de Transporte', () => {

  // Antes de todas las pruebas, nos aseguramos de que la BD esté conectada
  beforeAll(async () => {
    // Aquí iría la lógica para conectar a una BD de PRUEBAS
    // Por ahora, nos aseguramos de que la conexión principal se cierre al final
  });

  // Después de todas las pruebas, cerramos la conexión para que Jest no se quede colgado
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Prueba para un endpoint raíz GET /
  it('Debería responder con un mensaje de bienvenida en GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200);

    // Verificamos que el cuerpo de la respuesta sea el esperado
    expect(response.body).toEqual({ message: 'API de Gestión de Transporte funcionando' });
  });

  // Prueba para un endpoint que no existe
  it('Debería responder con un 404 para rutas no encontradas', async () => {
    await request(app)
      .get('/una-ruta-que-no-existe')
      .expect(404);
  });
});
```

### Paso 5: Estrategia para la Base de Datos de Pruebas

Es **fundamental** no ejecutar las pruebas sobre la base de datos de desarrollo. Crearemos una configuración para que, cuando el entorno sea `test`, la aplicación se conecte a una base de datos separada.

1.  **Configuración de Entorno:** Usaremos una variable de entorno en el script de test para señalar que estamos en modo prueba.
    ```json
    "scripts": {
      "test": "cross-env NODE_ENV=test jest"
    }
    ```
    *(Será necesario instalar `cross-env`: `npm install --save-dev cross-env`)*

2.  **Lógica de Conexión:** En `backend/config/database.ts`, modificaremos la lógica para seleccionar la URI de la base de datos según `NODE_ENV`.

    ```typescript
    const mongoUri = process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI;

    // Conectar a mongoUri
    ```

3.  **Limpieza de la Base de Datos:** Entre pruebas, es vital limpiar la base de datos para que los tests sean independientes unos de otros. Podemos usar hooks de Jest (`beforeEach` o `afterEach`) para eliminar los datos de las colecciones.

## 4. Próximos Pasos

1.  **Implementar el Paso 1, 2 y 3** para tener la infraestructura de pruebas lista.
2.  **Crear el endpoint de "health check" y la primera prueba (Paso 4)** para verificar que todo el sistema funciona.
3.  **Implementar la estrategia de la base de datos de pruebas (Paso 5)**.
4.  **Comenzar a escribir pruebas para los módulos más críticos:**
    *   Autenticación (`authController.ts`): Probar login, registro, protección de rutas.
    *   Controladores de lógica de negocio principal (`viajeController.ts`, `tramoController.ts`).
    *   Servicios con lógica compleja (`tarifaService.ts`).

Este plan nos guiará para construir una red de seguridad que proteja la integridad de nuestro backend y nos permita desarrollar con mayor confianza y agilidad.
