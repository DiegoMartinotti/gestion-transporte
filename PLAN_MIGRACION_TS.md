# Plan de Migración del Backend a TypeScript

Este documento detalla los pasos para migrar el backend existente de Node.js/Express/Mongoose de JavaScript (JS) a TypeScript (TS). La migración se realizará de forma incremental para minimizar riesgos y permitir el desarrollo continuo.

**Nota Importante:** Después de que confirmes la finalización de cada paso, actualizaré este plan marcando la casilla correspondiente.

## Fase 1: Preparación y Configuración Inicial

-   [x] **1.1 Instalar Dependencias de TypeScript:**
    *   Añadir TypeScript y las herramientas necesarias como dependencias de desarrollo.
        ```powershell
        npm install --save-dev typescript ts-node @types/node @types/express @types/mongoose @types/jsonwebtoken @types/cors @types/cookie-parser @types/supertest @types/jest
        # Añadir @types/ para otras dependencias clave si es necesario (ej. bcrypt, etc.)
        ```
    *   Verificar que `package.json` y `package-lock.json` se actualizan.

-   [x] **1.2 Crear Archivo de Configuración de TypeScript (`tsconfig.json`):**
    *   Crear un archivo `tsconfig.json` en la raíz del directorio `backend`.
    *   Configurar opciones iniciales para permitir una migración incremental. Un ejemplo de configuración podría ser:
        ```json
        {
          "compilerOptions": {
            "target": "ES2016", // O una versión compatible con tu versión de Node.js
            "module": "CommonJS",
            "outDir": "./dist", // Directorio para los archivos JS compilados
            "rootDir": "./",   // Directorio raíz de los fuentes (incluirá JS y TS)
            "strict": true,     // Habilitar todas las comprobaciones estrictas (recomendado)
            "esModuleInterop": true, // Necesario para compatibilidad con módulos CommonJS
            "skipLibCheck": true,  // Opcional: acelera la compilación inicial
            "forceConsistentCasingInFileNames": true,
            "allowJs": true,    // ¡Crucial! Permite que TS compile archivos JS
            "checkJs": false,   // No comprobar errores en archivos JS (para empezar)
            "resolveJsonModule": true, // Para importar archivos JSON
            "sourceMap": true // Generar sourcemaps para depuración
          },
          "include": [
            "**/*.ts", // Incluir todos los archivos TS
            "**/*.js"  // Incluir todos los archivos JS (para permitir migración gradual)
            // "**/*.json" // Si necesitas importar JSON directamente
          ],
          "exclude": [
            "node_modules",
            "dist",
            "**/*.test.ts", // Excluir archivos de test si se manejan por separado
            "__tests__",
             "docs",
             "examples",
             "scripts", // Excluir si no contienen código a ejecutar directamente
             "temp",
             "uploads"
          ]
        }
        ```
    *   Ajustar `include`, `exclude` y `rootDir` según la estructura final deseada.

-   [x] **1.3 Actualizar Scripts en `package.json`:**
    *   Modificar los scripts `dev`, `start`, `build` (y `test` si es necesario) para usar `ts-node` (desarrollo) y `tsc` (build).
        *   **Ejemplo `dev` (usando `nodemon` y `ts-node`):**
            ```json
            "dev": "nodemon index.ts" // O el punto de entrada principal si cambia a .ts
            ```
            *Nota: Puede que necesites `nodemon --exec ts-node index.ts` o configurar `nodemon.json` para vigilar archivos `.ts` y ejecutar con `ts-node`.*
            *Verificar/Actualizar `nodemon.json`:*
            ```json
            {
              "watch": ["."], // O directorios específicos ["src/", "config/"]
              "ext": "ts,js,json", // Añadir 'ts'
              "ignore": ["node_modules/", "dist/", "__tests__/"],
              "exec": "ts-node ./index.ts" // O tu punto de entrada
            }
            ```
        *   **Ejemplo `build`:**
            ```json
            "build": "tsc"
            ```
        *   **Ejemplo `start` (para producción, ejecutar JS compilado):**
            ```json
            "start": "node dist/index.js" // O el punto de entrada compilado
            ```

-   [x] **1.4 Actualizar `.gitignore`:**
    *   Añadir el directorio de salida (`dist/` o el que definas en `outDir`) y otros artefactos de TS (`*.tsbuildinfo`).
        ```
        # TypeScript
        dist/
        *.tsbuildinfo
        ```

-   [x] **1.5 Revisión y Aumento de Cobertura de Pruebas:**
    *   Antes de migrar código, revisar la suite de pruebas existente (`__tests__`).
    *   Asegurarse de que las pruebas existentes pasen con la nueva configuración (puede requerir `ts-jest` si usas Jest).
    *   **Identificar áreas críticas** (autenticación, lógica de negocio compleja como tarifas, importaciones) y **aumentar la cobertura de pruebas** si es baja. *Este paso es fundamental para una migración segura.*

-   [x] **1.6 Commit Inicial:**
    *   Realizar un commit con toda la configuración inicial y las dependencias instaladas. `git commit -m "chore: Setup TypeScript environment for backend migration"`

## Fase 2: Migración Incremental de Módulos

*Estrategia:* Empezar por módulos con menos dependencias (hojas del árbol de dependencias) e ir avanzando hacia el núcleo de la aplicación. Se recomienda hacer commits frecuentes después de migrar cada módulo o grupo pequeño de módulos.

-   [x] **2.1 Migrar Módulos de Utilidades (`utils/`, `config/`):**
    *   Para cada archivo `.js` en estos directorios:
        *   Renombrarlo a `.ts`.
        *   Ejecutar `tsc --noEmit` o revisar los errores en el editor.
        *   Corregir errores iniciales (pueden ser pocos si no hay dependencias complejas).
        *   Añadir tipos explícitos a parámetros de funciones, valores de retorno y variables.
        *   Ejecutar pruebas relevantes si existen.
    *   *Commit ejemplo: `feat: Migrate utils modules to TypeScript`*

-   [x] **2.2 Migrar Middlewares (`middleware/`):**
    *   Repetir el proceso para los archivos en `middleware/`.
    *   Prestar especial atención a tipar los objetos `req`, `res`, `next` de Express (usar `Request`, `Response`, `NextFunction` de `@types/express`).
    *   *Commit ejemplo: `feat: Migrate middleware functions to TypeScript`*

-   [ ] **2.3 Migrar Validadores (`validators/`):**
    *   Migrar los archivos de validación.
    *   Tipar los esquemas de validación (si usas librerías como Joi o express-validator, suelen tener soporte para TS o tipos definidos).
    *   *Commit ejemplo: `feat: Migrate validators to TypeScript`*

-   [ ] **2.4 Migrar Modelos (`models/`):**
    *   Este es un paso clave. Para cada modelo Mongoose:
        *   Renombrar el archivo `.js` a `.ts`.
        *   Definir una `interface` de TypeScript que represente la estructura del documento MongoDB (ej. `interface IUser extends Document { ... }`).
        *   Tipar el `Schema` de Mongoose y el `Model` (ej. `const UserModel = model<IUser>('User', userSchema);`).
        *   Asegurar que los tipos se usan consistentemente.
    *   *Commit ejemplo: `feat: Migrate Mongoose models to TypeScript`*

-   [ ] **2.5 Migrar Servicios (`services/`):**
    *   Migrar la lógica de negocio en `services/`.
    *   Asegurarse de usar correctamente los tipos definidos en los Modelos al interactuar con la base de datos.
    *   Tipar las entradas y salidas de las funciones de servicio.
    *   *Commit ejemplo: `feat: Migrate service layer to TypeScript`*

-   [ ] **2.6 Migrar Controladores (`controllers/`):**
    *   Migrar los controladores.
    *   Tipar `req` (especialmente `req.body`, `req.params`, `req.query`) y `res`. Usar las interfaces de los modelos y tipos definidos para las respuestas.
    *   Utilizar los tipos de los servicios que se invoquen.
    *   *Commit ejemplo: `feat: Migrate controllers to TypeScript`*

-   [ ] **2.7 Migrar Rutas (`routes/`):**
    *   Migrar los archivos de definición de rutas.
    *   Asegurar que los middlewares y controladores importados (ahora en TS) se usan correctamente.
    *   *Commit ejemplo: `feat: Migrate route definitions to TypeScript`*

-   [ ] **2.8 Migrar Archivos Principales (`app.ts`, `server.ts`, `index.ts`):**
    *   Renombrar y migrar los archivos raíz de la aplicación (`app.js` -> `app.ts`, etc.).
    *   Asegurarse de que todas las importaciones y configuraciones iniciales funcionen correctamente con TypeScript.
    *   Verificar que la aplicación se inicia y funciona como se espera (`npm run dev`).
    *   *Commit ejemplo: `feat: Migrate core application files (app, server, index) to TypeScript`*

## Fase 3: Refinamiento y Limpieza

-   [ ] **3.1 Eliminar `allowJs` y `checkJs` (Opcional):**
    *   Una vez que *todos* los archivos `.js` relevantes hayan sido migrados a `.ts`, se puede considerar poner `allowJs: false` en `tsconfig.json` para asegurar que solo se usa TypeScript. `checkJs` ya debería estar en `false`.

-   [ ] **3.2 Revisar y Eliminar Usos de `any`:**
    *   Buscar en el código base usos explícitos o implícitos de `any`.
    *   Intentar reemplazarlos con tipos más específicos o interfaces/types definidos. Usar `unknown` si el tipo no se conoce de forma segura.

-   [ ] **3.3 Refactorización (Opcional):**
    *   Buscar oportunidades para mejorar el código usando características de TypeScript (enums, clases con modificadores de acceso, genéricos, utility types) donde tenga sentido.

-   [ ] **3.4 Ejecución Completa de Pruebas:**
    *   Ejecutar toda la suite de pruebas y asegurarse de que todo pasa.
    *   Realizar pruebas manuales E2E (End-to-End) de las funcionalidades críticas.

## Fase 4: Actualización de Build y Despliegue

-   [ ] **4.1 Verificar el Build de Producción:**
    *   Ejecutar `npm run build`.
    *   Verificar que los archivos JavaScript compilados se generan correctamente en el directorio `dist/`.
    *   Revisar que no haya errores durante la compilación.

-   [ ] **4.2 Probar el Entorno de Producción:**
    *   Ejecutar la aplicación usando el script `start` (que ejecuta el JS compilado desde `dist/`). `npm start`
    *   Asegurarse de que la aplicación funciona correctamente en modo producción.

-   [ ] **4.3 Actualizar Pipelines de CI/CD:**
    *   Modificar los pipelines de integración continua y despliegue continuo para incluir el paso de compilación (`npm run build`) y para ejecutar la aplicación desde el directorio `dist/`.

## Fase 5: Finalización

-   [ ] **5.1 Documentación:**
    *   Actualizar cualquier documentación interna (README, etc.) para reflejar el uso de TypeScript y los nuevos scripts o procesos.
-   [ ] **5.2 Merge Final:**
    *   Fusionar la rama de migración a la rama principal (si se usó una rama separada). 