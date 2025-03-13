# Guía de uso del Logger

## Introducción

Este proyecto utiliza un sistema de logging centralizado que permite mostrar diferentes niveles de logs según el entorno de ejecución:

- En **desarrollo**: se muestran todos los logs (debug, info, warn, error, critical)
- En **producción**: solo se muestran los errores (error, critical)

## Configuración del entorno

El entorno se configura en el archivo `.env` en la raíz del proyecto:

```
NODE_ENV=development  # Muestra todos los logs
```

o

```
NODE_ENV=production   # Solo muestra errores
```

Para cambiar el entorno, puede utilizar los scripts proporcionados:

```bash
# Cambiar a entorno de desarrollo (mostrar todos los logs)
node scripts/set-development.js

# Cambiar a entorno de producción (solo mostrar errores)
node scripts/set-production.js
```

## Uso del logger en el backend

```javascript
const logger = require('../utils/logger');

// Solo se muestra en desarrollo
logger.debug('Información detallada para depuración');
logger.info('Información general');
logger.warn('Advertencia');

// Se muestra en todos los entornos
logger.error('Error');
logger.critical('Error crítico');
```

## Uso del logger en el frontend

```javascript
import logger from '../utils/logger';

// Solo se muestra en desarrollo
logger.debug('Información detallada para depuración');
logger.info('Información general');
logger.warn('Advertencia');

// Se muestra en todos los entornos
logger.error('Error');
logger.critical('Error crítico');
```

## Verificación del uso del logger

Para verificar que todo el proyecto utiliza correctamente el logger, puede ejecutar:

### Scripts compatibles con Linux/Mac/WSL

```bash
# Verificar el uso del logger en el backend
node scripts/verify-logger.js

# Migrar el código del frontend al nuevo sistema de logger
node scripts/migrate-frontend-logger.js
```

### Scripts compatibles con Windows (sin dependencias externas)

Si está utilizando Windows y no tiene acceso a comandos como `grep`, puede utilizar las versiones alternativas de los scripts:

```bash
# Verificar el uso del logger en todo el proyecto
node scripts/verify-logger-node.js

# Migrar el código del frontend al nuevo sistema de logger
node scripts/migrate-frontend-logger-node.js
```

Estos scripts utilizan Node.js puro y no dependen de comandos externos como `grep` o PowerShell.

## Buenas prácticas

1. **Nunca use `console.log`, `console.warn` o `console.error` directamente** en el código de la aplicación. Utilice siempre el logger centralizado.

2. **Elija el nivel de log adecuado**:
   - `debug`: Información detallada para depuración
   - `info`: Información general sobre el funcionamiento de la aplicación
   - `warn`: Advertencias que no impiden el funcionamiento pero deben ser revisadas
   - `error`: Errores que afectan el funcionamiento pero no detienen la aplicación
   - `critical`: Errores críticos que pueden detener la aplicación

3. **Incluya contexto en los mensajes de error**:
   ```javascript
   // Mal
   logger.error('Error al procesar');
   
   // Bien
   logger.error('Error al procesar el pago:', error, { userId, orderId });
   ```

4. **Utilice el logger para información relevante**, no para seguimiento de flujo normal:
   ```javascript
   // Evitar
   logger.debug('Entrando en la función procesarPago');
   logger.debug('Saliendo de la función procesarPago');
   
   // Preferible
   logger.debug('Procesando pago:', { amount, currency, method });
   ```

## Estructura del logger

El logger está implementado en:

- Backend: `backend/utils/logger.js`
- Frontend: `frontend/src/utils/logger.js`

Ambos módulos tienen la misma interfaz y comportamiento, adaptados a sus respectivos entornos. 