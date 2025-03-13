# Reglas de Cursor para el Desarrollo

## Formato de Fechas en Frontend

### Regla: Uso consistente del formato DD/MM/YYYY
Siempre que se trabaje con fechas en componentes o utilidades del frontend, se debe utilizar el formato "DD/MM/YYYY".

#### Implementación:
1. En componentes DatePicker:
```javascript
<DatePicker format="DD/MM/YYYY" />
```

2. En utilidades de formateo:
```javascript
dayjs(date).format('DD/MM/YYYY')
```

3. Para fechas ISO:
```javascript
const formatISODate = (isoString) => dayjs(isoString).format('DD/MM/YYYY');
```

#### Razón:
- Mantener consistencia en la presentación de fechas en toda la aplicación
- Seguir el formato más común y comprensible en español
- Evitar confusiones entre formatos MM/DD/YYYY y DD/MM/YYYY

#### Excepciones:
- Cuando se envían datos al backend (usar ISO)
- Cuando se requiere un formato específico por requerimientos del cliente
- Cuando se trabaja con bibliotecas que requieren un formato específico 

## Análisis de Contexto y Toma de Decisiones

### Regla: Evaluación Exhaustiva del Contexto
Antes de realizar cualquier modificación o implementación, se debe realizar un análisis completo del contexto existente.

#### Implementación:
1. Revisión de archivos relacionados:
- Verificar dependencias y imports
- Analizar componentes padres e hijos
- Revisar utilidades y helpers relacionados

2. Evaluación de impacto:
- Identificar posibles efectos secundarios
- Verificar compatibilidad con funcionalidades existentes
- Analizar impacto en el rendimiento

3. Documentación y referencias:
- Consultar documentación existente
- Revisar comentarios relevantes en el código
- Verificar reglas y estándares del proyecto

## Buenas Prácticas de Desarrollo

### Regla: Estándares de Código y Calidad

#### Implementación:
1. Nomenclatura y estructura:
```javascript
// Nombres descriptivos y en español
const obtenerUsuarioPorId = (id) => {...}

// Organización clara de imports
import { ComponentePrincipal } from './componentes';
import { utilidad } from './utilidades';
```

2. Documentación de código:
```javascript
/**
 * @descripcion Gestiona la lógica de negocio para usuarios
 * @param {string} id - Identificador único del usuario
 * @returns {Object} Datos del usuario
 */
```

3. Manejo de errores:
```javascript
try {
  await operacionAsincrona();
} catch (error) {
  console.error('Error específico:', error.message);
  // Manejo apropiado del error
}
```

#### Razón:
- Asegurar mantenibilidad y escalabilidad del código
- Facilitar la colaboración entre desarrolladores
- Prevenir errores y comportamientos inesperados
- Mejorar la calidad general del código

#### Consideraciones Adicionales:
- Realizar pruebas unitarias cuando sea posible
- Implementar validaciones robustas
- Mantener la consistencia con el estilo del proyecto
- Optimizar el rendimiento cuando sea necesario 

## Uso del Logger

### Regla: Implementación Consistente del Logger Centralizado

#### Implementación:
1. Importación y configuración:
```javascript
const logger = require('../utils/logger');
```

2. Niveles de log apropiados:
```javascript
// Para información de depuración detallada
logger.debug('Detalles de la operación:', { 
    id: proceso.id,
    estado: proceso.estado 
});

// Para información general del flujo de la aplicación
logger.info('Operación completada exitosamente');

// Para advertencias que no interrumpen el flujo
logger.warn('Recurso próximo a agotarse:', recurso);

// Para errores que requieren atención
logger.error('Error en la operación:', error);
```

3. Estructuración de mensajes:
```javascript
// Mensaje descriptivo + objeto de datos
logger.info('Procesando solicitud:', {
    método: req.method,
    ruta: req.path,
    parámetros: req.params
});

// Errores con contexto completo
logger.error('Error en transacción:', {
    error: error.message,
    stack: error.stack,
    contexto: {
        operación: 'nombre_operación',
        datos: datosRelevantes
    }
});
```

#### Razón:
- Mantener consistencia en el registro de eventos
- Facilitar el diagnóstico de problemas
- Mejorar la trazabilidad de operaciones
- Permitir diferentes niveles de detalle según el entorno

#### Consideraciones:
1. Uso de niveles:
   - `debug`: Información detallada para desarrollo
   - `info`: Eventos normales del sistema
   - `warn`: Situaciones inesperadas pero manejables
   - `error`: Errores que requieren atención inmediata

2. Información sensible:
   - Nunca registrar contraseñas o tokens
   - Enmascarar datos personales sensibles
   - Cumplir con regulaciones de privacidad

3. Contexto:
   - Incluir IDs de transacción
   - Agregar timestamps cuando sea relevante
   - Proporcionar suficiente contexto para debugging

4. Performance:
   - Evitar logging excesivo en producción
   - Usar logging condicional cuando sea apropiado
   - Considerar el impacto en el rendimiento

#### Excepciones:
- Cuando se requiera logging específico por requerimientos del cliente
- En casos de debugging temporal (recordar remover)
- Cuando se necesite un formato especial para herramientas de monitoreo 