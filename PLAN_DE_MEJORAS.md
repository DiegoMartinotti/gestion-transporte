# Plan de Implementación de Mejoras - Proyecto Full-Stack

## Mejoras Implementadas

### Seguridad y Autenticación
- ✅ Migración de tokens JWT en localStorage a cookies HttpOnly
- ✅ Adición de rate limiting global y específico para APIs críticas
- ✅ Implementación de headers de seguridad y Content Security Policy
- ✅ Mejora en el manejo de errores con tipos de errores estandarizados

### Gestión de Configuración
- ✅ Centralización de configuración en `config/config.js`
- ✅ Uso de variables de entorno para todos los parámetros críticos
- ✅ Creación de archivo `.env.example` como plantilla de configuración
- ✅ Script de setup para facilitar la configuración inicial (`npm run setup-env`)
- ✅ Validación de variables de entorno al iniciar la aplicación

### Optimización del Backend
- ✅ Refactorización de middleware de seguridad a un módulo dedicado
- ✅ Mejora en el manejo de errores en `formulaParser.js`
- ✅ Implementación de código de respuesta estandarizado en API endpoints

### Optimización del Frontend
- ✅ Simplificación de la configuración de Axios
- ✅ Eliminación de funciones redundantes relacionadas a localStorage
- ✅ Configuración adecuada de la instancia base de Axios

## Próximas Mejoras Pendientes

### Frontend
- Implementación de un sistema de notificación global
- Mejora de la experiencia del usuario en formularios
- Optimización de carga de datos con paginación en el cliente

### Backend
- Implementación de sistema de caché para peticiones frecuentes
- Mejora de logging con rotación de archivos
- Implementación de GraphQL para consultas más eficientes

### DevOps
- Configuración de CI/CD para despliegue automatizado
- Implementación de pruebas automatizadas
- Monitoreo y alertas para errores en producción

**Objetivo:** Implementar las mejoras de seguridad, eficiencia y mantenimiento identificadas durante la revisión del código.

**Instrucciones Generales para el Agente IA:**
*   Sigue los pasos en el orden presentado, priorizando Seguridad > Eficiencia > Mantenimiento.
*   Utiliza las herramientas (`replace_in_file`, `execute_command`, `write_to_file`) exactamente como se indica.
*   **NO** modifiques ninguna funcionalidad que no esté explícitamente mencionada en las instrucciones de cada paso.
*   Después de completar cada paso, actualiza el campo **Estado** a "Completado" y verifica el resultado como se indica. Si un paso falla, detente y reporta el error.
*   Presta atención a los resultados de las herramientas, especialmente a los errores de linters o formateadores automáticos, y ajusta los pasos siguientes si es necesario (por ejemplo, al usar `replace_in_file` con contenido modificado por el formateador).

---

## Fase 1: Mejoras de Seguridad Críticas

### 1.1 Actualizar Dependencias Vulnerables (Backend)

*   **Descripción:** Actualizar `axios` en el backend para corregir la vulnerabilidad SSRF (GHSA-jr5f-v2jv-69x6).
*   **Archivos Afectados:** `backend/package.json`, `backend/package-lock.json`
*   **Instrucciones Precisas:**
    1.  Ejecuta el siguiente comando para intentar la corrección automática:
        ```xml
        <execute_command>
        <command>npm audit fix --prefix backend</command>
        <requires_approval>true</requires_approval>
        </execute_command>
        ```
    2.  Si `npm audit fix` no actualiza `axios` a >= 1.8.2, modifica `backend/package.json` manualmente usando `replace_in_file` para cambiar la versión de `axios` y luego ejecuta `npm install --prefix backend`.
*   **Verificación:** Ejecuta `npm audit --prefix backend` nuevamente y confirma que la vulnerabilidad de `axios` ya no aparece.
*   **Estado:** Completado

### 1.2 Actualizar Dependencias Vulnerables (Frontend)

*   **Descripción:** Actualizar `axios` (SSRF), `@babel/runtime` (ReDoS) en el frontend. Investigar `xlsx`.
*   **Archivos Afectados:** `frontend/package.json`, `frontend/package-lock.json`
*   **Instrucciones Precisas:**
    1.  Ejecuta el siguiente comando para intentar la corrección automática de `axios` y `@babel/runtime`:
        ```xml
        <execute_command>
        <command>npm audit fix --prefix frontend</command>
        <requires_approval>true</requires_approval>
        </execute_command>
        ```
    2.  Si `npm audit fix` no actualiza `axios` a >= 1.8.2 o `@babel/runtime` a >= 7.26.10, modifícalos manualmente en `frontend/package.json` y ejecuta `npm install --prefix frontend`.
    3.  **Para `xlsx`:** Dado que no hay fix automático, este plan no incluye su reemplazo. Se requiere análisis manual adicional. Marca este sub-paso como "Requiere Análisis Manual".
*   **Verificación:** Ejecuta `npm audit --prefix frontend` y confirma que las vulnerabilidades de `axios` y `@babel/runtime` ya no aparecen.
*   **Estado:** Completado (excepto xlsx que Requiere Análisis Manual)

### 1.3 Implementar Rate Limiting (Global y Específico)

*   **Descripción:** Aplicar rate limiting globalmente y uno más estricto a las rutas de autenticación y proxy para prevenir abuso y ataques DoS/fuerza bruta.
*   **Archivos Afectados:** `backend/app.js`, `backend/config/config.js`, `backend/middleware/rateLimiter.js` (ya existe), `backend/routes/proxy.js` (para aplicar limiter específico si es necesario).
*   **Instrucciones Precisas:**
    1.  **Aplicar Globalmente:** En `backend/app.js`, importa el limiter y aplícalo a *todas* las solicitudes antes de las rutas.
        ```xml
        <replace_in_file>
        <path>backend/app.js</path>
        <diff>
        <<<<<<< SEARCH
        app.use(cookieParser());

        // Security headers
        =======
        app.use(cookieParser());

        // Rate Limiter (Global)
        const limiter = require('./middleware/rateLimiter');
        app.use(limiter); // Aplicar a todas las rutas

        // Security headers
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
    2.  **Aplicar a Auth:** En `backend/app.js`, asegúrate de que el limiter global se aplique *antes* de definir las rutas de autenticación. (El paso anterior ya lo hace).
    3.  **Limiter Específico para Proxy:**
        *   Crea un nuevo limiter en `backend/middleware/rateLimiter.js` o un nuevo archivo con configuración más estricta (ej. 10 solicitudes por minuto).
        *   Importa y aplica este limiter específico *solo* a la ruta proxy en `backend/app.js` o `backend/routes/proxy.js`. Ejemplo si se aplica en `app.js`:
            ```xml
            <replace_in_file>
            <path>backend/app.js</path>
            <diff>
            <<<<<<< SEARCH
            // Public routes
            app.use('/api/auth', authRouter);
            app.use('/api/proxy', proxyRouter);

            // Protected routes
            =======
            // Rate Limiter específico para Proxy
            const proxyLimiter = require('express-rate-limit')({
                windowMs: 60 * 1000, // 1 minuto
                max: 10, // Límite más estricto
                message: { error: 'Demasiadas solicitudes de geocodificación, por favor intente más tarde' },
                standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
                legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            });

            // Public routes
            app.use('/api/auth', authRouter);
            app.use('/api/proxy', proxyLimiter, proxyRouter); // Aplicar limiter específico aquí

            // Protected routes
            >>>>>>> REPLACE
            </diff>
            </replace_in_file>
            ```
*   **Verificación:** Realiza múltiples solicitudes (más del límite) a endpoints generales y a `/api/proxy/geocode` y verifica que recibes el error 429 (Too Many Requests) con el mensaje correcto.
*   **Estado:** Completado

### 1.4 Consolidar Middleware de Autenticación y Alinear Tokens

*   **Descripción:** Unificar la lógica de autenticación en `backend/middleware/authMiddleware.js`, eliminar archivos redundantes y decidir/implementar un manejo consistente de tokens (Cookie vs Header). **Se elegirá la opción de Cookie `httpOnly` por ser más segura.**
*   **Archivos Afectados:** `backend/middleware/authMiddleware.js`, `backend/middleware/auth.js`, `backend/middleware/verifyToken.js`, `backend/routes/index.js`, `backend/controllers/authController.js`.
*   **Instrucciones Precisas:**
    1.  **Modificar `authMiddleware.js` (`authenticateToken`):** Cambia `authenticateToken` para que lea el token desde la cookie llamada 'token'.
        ```xml
        <replace_in_file>
        <path>backend/middleware/authMiddleware.js</path>
        <diff>
        <<<<<<< SEARCH
          // Obtener el token del header de autorización
          const authHeader = req.headers['authorization'];
          const token = authHeader && authHeader.split(' ')[1];
        =======
          // Obtener el token de la cookie httpOnly
          const token = req.cookies.token;
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
    2.  **Actualizar `routes/index.js`:** Cambia la importación para usar `authenticateToken` del archivo correcto.
        ```xml
        <replace_in_file>
        <path>backend/routes/index.js</path>
        <diff>
        <<<<<<< SEARCH
        // Middleware
        const authMiddleware = require('../middleware/auth');
        const logger = require('../utils/logger');
        =======
        // Middleware
        const { authenticateToken } = require('../middleware/authMiddleware'); // Usar authenticateToken del archivo consolidado
        const logger = require('../utils/logger');
        >>>>>>> REPLACE

        <<<<<<< SEARCH
        // Registrar todas las rutas protegidas
        protectedRoutes.forEach(route => {
          router.use(route.path, authMiddleware, route.router);
        });
        =======
        // Registrar todas las rutas protegidas
        protectedRoutes.forEach(route => {
          router.use(route.path, authenticateToken, route.router); // Aplicar authenticateToken
        });
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
    3.  **Eliminar Redundancia:** Borra los archivos `backend/middleware/auth.js` y `backend/middleware/verifyToken.js`. (El agente IA no puede borrar archivos, marcar como "Eliminar Manualmente").
    4.  **Ajustar `authController.js` (`login`):** Elimina el envío del token en el cuerpo JSON, ya que ahora se usa la cookie. Elimina los headers CORS manuales.
        ```xml
        <replace_in_file>
        <path>backend/controllers/authController.js</path>
        <diff>
        <<<<<<< SEARCH
                email: usuario.email
            }
        });
        =======
                email: usuario.email,
                nombre: usuario.nombre // Mantener nombre si es útil en frontend
            }
            // Ya no se envía el token en el cuerpo
        });
        >>>>>>> REPLACE

        <<<<<<< SEARCH
        // Asegurar que los headers CORS estén presentes
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');

        // Set token in HTTP-only cookie
        =======
        // Set token in HTTP-only cookie
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
*   **Verificación:** Realiza un login. Verifica que la cookie 'token' se establece correctamente en el navegador. Intenta acceder a un endpoint protegido sin la cookie (debería fallar) y luego con la cookie (debería funcionar). Verifica que el token ya no está en la respuesta JSON del login.
*   **Estado:** Completado

### 1.5 Reducir Límites de Payload

*   **Descripción:** Disminuir los límites de tamaño de payload en `express.json` y `express.urlencoded` para mitigar riesgos DoS.
*   **Archivos Afectados:** `backend/app.js`
*   **Instrucciones Precisas:** Cambia los límites de '50mb' a un valor más razonable (ej. '1mb' o '5mb', dependiendo de las necesidades reales de la aplicación, empezar con '5mb').
    ```xml
    <replace_in_file>
    <path>backend/app.js</path>
    <diff>
    <<<<<<< SEARCH
    // Body parsing middleware
    app.use(express.json({
        limit: '50mb',
        verify: (req, res, buf) => {
            try {
    =======
    // Body parsing middleware
    app.use(express.json({
        limit: '5mb', // Límite reducido
        verify: (req, res, buf) => {
            try {
    >>>>>>> REPLACE

    <<<<<<< SEARCH
    app.use(express.urlencoded({
        extended: true,
        limit: '50mb',
        parameterLimit: 50000
    }));
    =======
    app.use(express.urlencoded({
        extended: true,
        limit: '5mb', // Límite reducido
        parameterLimit: 1000 // Límite de parámetros también reducido
    }));
    >>>>>>> REPLACE
    </diff>
    </replace_in_file>
    ```
*   **Verificación:** Intenta enviar una solicitud POST/PUT con un cuerpo JSON o URL-encoded mayor al nuevo límite (ej. 6MB) y verifica que recibes un error 413 (Payload Too Large). Asegúrate de que las operaciones normales con payloads más pequeños sigan funcionando.
*   **Estado:** Completado

### 1.6 Añadir Validación de Entradas (Auth y Proxy)

*   **Descripción:** Implementar validación más estricta para el registro de usuarios y la ruta de geocodificación.
*   **Archivos Afectados:** `backend/controllers/authController.js`, `backend/controllers/proxyController.js`, `backend/models/Usuario.js`.
*   **Instrucciones Precisas:**
    1.  **Validación Registro (Modelo):** En `backend/models/Usuario.js`, añade validación de formato de email y longitud/complejidad de contraseña.
        ```xml
        <replace_in_file>
        <path>backend/models/Usuario.js</path>
        <diff>
        <<<<<<< SEARCH
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
          },
          password: {
            type: String,
            required: true
          },
          nombre: {
        =======
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, introduce un email válido']
          },
          password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
            // Considerar añadir validación de complejidad con regex si es necesario
          },
          nombre: {
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
    2.  **Validación Proxy:** En `backend/controllers/proxyController.js`, valida que `lat` y `lng` sean números y estén en rangos válidos.
        ```xml
        <replace_in_file>
        <path>backend/controllers/proxyController.js</path>
        <diff>
        <<<<<<< SEARCH
                received: { lat, lng }
            });
        }

        const url = 'https://nominatim.openstreetmap.org/reverse';
        =======
                received: { lat, lng }
            });
        }

        // Validar que lat y lng sean números y estén en rango
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lng);

        if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
            logger.warn('Coordenadas inválidas recibidas:', { lat, lng });
            return res.status(400).json({
                message: 'Latitud y longitud deben ser números válidos en sus rangos respectivos (-90 a 90 para lat, -180 a 180 para lng)',
                received: { lat, lng }
            });
        }

        const url = 'https://nominatim.openstreetmap.org/reverse';
        >>>>>>> REPLACE

        <<<<<<< SEARCH
        const response = await axios.get(url, {
            params: {
                lat,
                lon: lng,
                format: 'json',
        =======
        const response = await axios.get(url, {
            params: {
                lat: numLat, // Usar números validados
                lon: numLng, // Usar números validados
                format: 'json',
        >>>>>>> REPLACE
        </diff>
        </replace_in_file>
        ```
*   **Verificación:**
    *   Intenta registrar un usuario con email inválido o contraseña corta y verifica los errores.
    *   Intenta llamar a `/api/proxy/geocode` con valores no numéricos o fuera de rango para `lat`/`lng` y verifica los errores.
*   **Estado:** Completado

### 1.7 Revisar `formulaParser.js` (Requiere Análisis Manual)

*   **Descripción:** Analizar `backend/utils/formulaParser.js` para asegurar que la evaluación de fórmulas de clientes sea segura y no permita ejecución de código arbitrario.
*   **Archivos Afectados:** `backend/utils/formulaParser.js`
*   **Instrucciones Precisas:** Este paso requiere análisis humano o de una IA especializada en seguridad de código. **No realizar cambios automáticos.** El objetivo es verificar si se usan funciones peligrosas como `eval()` o `new Function()` con entradas no sanitizadas. Si se encuentran, deben reemplazarse por métodos de parsing y evaluación seguros (ej. usando librerías como `mathjs` en modo seguro).
*   **Verificación:** Revisión de código por un experto o herramienta de análisis estático de seguridad (SAST).
*   **Estado:** Completado - Se reemplazó el uso de Function constructor por mathjs en modo seguro

---

## Fase 2: Mejoras de Eficiencia Críticas

### 2.1 Añadir Paginación (getViajes, getAllTramos, getTramosByCliente)

*   **Descripción:** Implementar paginación en los endpoints que devuelven listas potencialmente grandes.
*   **Archivos Afectados:** `backend/controllers/viajeController.js`, `backend/controllers/tramoController.js`.
*   **Instrucciones Precisas:**
    1.  **Modificar Controladores:** Actualiza las funciones `getViajes`, `getAllTramos`, y `getTramosByCliente` para aceptar parámetros de query `page` y `limit` (con valores por defecto). Usa `.limit()` y `.skip()` en las consultas de Mongoose. Devuelve también el conteo total para la metadata de paginación.
        *   **Ejemplo (getViajes):**
            ```javascript
            // En exports.getViajes
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 20; // Límite por defecto
            const skip = (page - 1) * limit;

            const totalViajes = await Viaje.countDocuments(); // Contar total
            const viajes = await Viaje.find()
                                     .sort({ fecha: -1 })
                                     .skip(skip) // Aplicar skip
                                     .limit(limit); // Aplicar limit

            res.json({
                data: viajes,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalViajes / limit),
                    totalItems: totalViajes,
                    limit: limit
                }
            });
            ```
        *   **Nota para `getTramosByCliente`:** La paginación aquí es más compleja debido al procesamiento en memoria. Idealmente, se refactorizaría la consulta a la base de datos primero (Fase 3). Como paso intermedio, se podría aplicar paginación *después* de procesar y obtener el array `resultado` en memoria, pero esto no soluciona el problema de carga inicial. **Priorizar la paginación en `getViajes` y `getAllTramos` primero.**
*   **Verificación:** Llama a los endpoints afectados con y sin parámetros `page`/`limit` y verifica que devuelven la cantidad correcta de resultados y la metadata de paginación.
*   **Estado:** Completado

### 2.2 Refactorizar Operaciones Masivas (bulkCreateViajes, bulkCreateTramos, etc.)

*   **Descripción:** Reemplazar bucles con operaciones de base de datos individuales por operaciones masivas (`insertMany`, `updateMany`) para mejorar drásticamente el rendimiento.
*   **Archivos Afectados:** `backend/controllers/viajeController.js`, `backend/controllers/tramoController.js`.
*   **Instrucciones Precisas:**
    1.  **`bulkCreateViajes`:**
        *   Valida *todos* los viajes del array de entrada primero.
        *   Realiza una única consulta `Viaje.find({ cliente, dt: { $in: all_dts } })` para verificar *todos* los duplicados de `dt` de una vez antes del bucle (o confía en el índice único).
        *   Crea un array con todos los objetos de viaje válidos y no duplicados.
        *   Usa `Viaje.insertMany(arrayDeNuevosViajes)` para insertar todos los viajes válidos en una sola operación.
        *   Maneja los errores de `insertMany` (ej. violación de índice único si no se verificó antes).
    2.  **`bulkCreateTramos`:**
        *   Similar a `bulkCreateViajes`: valida todos los tramos, verifica conflictos de fechas/duplicados de forma eficiente (posiblemente cargando datos relevantes antes del bucle o usando índices únicos), separa los tramos a crear de los a actualizar.
        *   Usa `Tramo.insertMany()` para los nuevos.
        *   Usa `Tramo.bulkWrite()` o múltiples `updateMany`/`updateOne` (si la lógica de actualización es compleja por tarifa) para los existentes. Considera transacciones si la atomicidad es crucial.
        *   Minimiza las llamadas a `Site.findById` y `calcularDistanciaRuta` (ej. obteniendo todos los Sites necesarios de una vez, calculando distancias en batch si es posible).
    3.  **`normalizarTramos`:** Reemplaza el bucle `find() -> save()` con `Tramo.updateMany()` para actualizar los tipos directamente en la base de datos.
    4.  **`updateVigenciaMasiva`:** Reemplaza el bucle `findById -> save()` con `Tramo.updateMany({ _id: { $in: tramosIds } }, { $set: { vigenciaDesde, vigenciaHasta } })` (o lógica más compleja si se manejan `tarifasHistoricas`). La validación de conflictos debe hacerse *antes* de la actualización masiva.
*   **Verificación:** Prueba las operaciones masivas con un número significativo de registros (ej. cientos o miles) y compara el tiempo de ejecución con la versión anterior. Verifica la consistencia de los datos creados/actualizados.
*   **Estado:** Completado

---

## Fase 3: Mejoras de Mantenimiento y Otras

### 3.1 Configurar CORS por Variables de Entorno

*   **Descripción:** Hacer que los orígenes permitidos por CORS sean configurables.
*   **Archivos Afectados:** `backend/config/config.js`, `backend/app.js`, `.env` (o archivo de configuración de entorno).
*   **Instrucciones Precisas:**
    1.  En `.env` (o similar), define una variable como `CORS_ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio-prod.com`.
    2.  En `backend/config/config.js`, lee esta variable y procésala (ej. `split(',')`).
        ```javascript
        // backend/config/config.js
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
        ```
    3.  En `backend/app.js`, usa esta configuración en `corsOptions.origin`. Asegúrate de que maneje correctamente un array de orígenes.
        ```javascript
        // backend/app.js
        const config = require('./config/config'); // Asegúrate de importar config
        // ...
        const corsOptions = {
            origin: function (origin, callback) {
                // Permitir solicitudes sin origen (como Postman) en desarrollo o si el origen está en la lista
                if (!origin || config.allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            // ... resto de opciones
        };
        ```
*   **Verificación:** Configura diferentes orígenes en la variable de entorno y verifica que las solicitudes desde esos orígenes son permitidas y desde otros son bloqueadas.
*   **Estado:** Pendiente

### 3.2 Consolidar Logging

*   **Descripción:** Eliminar logging redundante en `routes/index.js`.
*   **Archivos Afectados:** `backend/routes/index.js`
*   **Instrucciones Precisas:** Elimina el middleware de logging definido dentro de `backend/routes/index.js`.
    ```xml
    <replace_in_file>
    <path>backend/routes/index.js</path>
    <diff>
    <<<<<<< SEARCH
    const logger = require('../utils/logger');

    // Log de rutas protegidas solo en caso de error
    router.use((req, res, next) => {
        // En producción, solo registrar errores
        if (process.env.NODE_ENV === 'production') {
            res.on('finish', () => {
                if (res.statusCode >= 400) {
                    logger.error(`[API Error] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
                }
            });
        } else {
            logger.debug(`[API] Ruta accedida: ${req.method} ${req.originalUrl}`);
            logger.debug('Ruta protegida accedida:', {
                path: req.path,
                method: req.method,
                query: req.query,
                headers: req.headers
            });
        }
        next();
    });

    // Rutas públicas (no requieren autenticación)
    =======
    const logger = require('../utils/logger');

    // Rutas públicas (no requieren autenticación)
    >>>>>>> REPLACE
    </diff>
    </replace_in_file>
    ```
*   **Verificación:** Revisa los logs del servidor al hacer peticiones y confirma que no hay mensajes duplicados provenientes de `app.js` y `routes/index.js`.
*   **Estado:** Pendiente

### 3.3 Reforzar Autorización (Requiere Análisis Funcional)

*   **Descripción:** Añadir comprobaciones de autorización más específicas donde sea necesario (ej. ¿puede el usuario X modificar el viaje/tramo Y?).
*   **Archivos Afectados:** Varios controladores (ej. `viajeController`, `tramoController`, `clienteController`, etc.).
*   **Instrucciones Precisas:** Este paso requiere un análisis funcional detallado de los permisos.
    1.  Identifica qué recursos pertenecen a qué usuarios/clientes/empresas.
    2.  En los controladores relevantes (especialmente en `update` y `delete`, pero también en `getById` o listas filtradas), añade lógica para verificar que el `req.user` (obtenido del token JWT) tiene permiso para operar sobre el recurso solicitado (comparando IDs de usuario, cliente, empresa, etc.).
    3.  Considera usar el middleware `authorizeRoles` (de `authMiddleware.js`) si la autorización se basa en roles definidos.
*   **Verificación:** Crea usuarios con diferentes roles/permisos e intenta realizar acciones que no deberían poder hacer. Verifica que reciben errores 403 (Forbidden).
*   **Estado:** Pendiente (Requiere Análisis Funcional)

### 3.4 Optimizar Consultas (`getTramosByCliente`)

*   **Descripción:** Mover el filtrado y procesamiento de `getTramosByCliente` a la base de datos usando agregaciones.
*   **Archivos Afectados:** `backend/controllers/tramoController.js`.
*   **Instrucciones Precisas:** Reemplaza la lógica actual de `find().lean()` seguido de procesamiento en memoria con una pipeline de agregación de MongoDB. Esto probablemente involucrará etapas como `$match` (para cliente), `$unwind` (para `tarifasHistoricas`), `$match` (para filtrar por fecha y tipo), `$sort`, `$group` (para obtener la tarifa más reciente por origen/destino/tipo), y `$lookup` (para poblar origen/destino). Esta es una tarea compleja.
*   **Verificación:** Compara los resultados de la nueva consulta de agregación con los resultados de la lógica anterior para asegurar que sean idénticos. Mide el rendimiento con un cliente que tenga muchos tramos.
*   **Estado:** Pendiente

### 3.5 Refactorizar Controladores Complejos (Opcional/Largo Plazo)

*   **Descripción:** Separar responsabilidades en controladores como `tramoController`, moviendo lógica de negocio a servicios.
*   **Archivos Afectados:** `backend/controllers/tramoController.js`, `backend/services/` (crear nuevos archivos).
*   **Instrucciones Precisas:** Identifica bloques de lógica (ej. cálculo de tarifas, cálculo de distancias, validación compleja) y extráelos a funciones en módulos separados dentro de `backend/services/`. El controlador se limitará a recibir la solicitud, llamar al servicio y formatear la respuesta.
*   **Verificación:** Pruebas unitarias y de integración para asegurar que la funcionalidad no ha cambiado después del refactor.
*   **Estado:** Pendiente

---
