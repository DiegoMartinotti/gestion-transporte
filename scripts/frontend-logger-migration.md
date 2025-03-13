# Migración del logger en el frontend

Este archivo contiene instrucciones para migrar cada archivo que utiliza console.log/warn/error al nuevo sistema de logger.

## frontend/src/components/CalcularTarifa.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 108: console.log('Campos faltantes:', { selectedCliente, origen, destino, tipoTramo });
logger.debug('Campos faltantes:', { selectedCliente, origen, destino, tipoTramo });

// Línea 120: console.log('Iniciando cálculo con tramos:', tramos);
logger.debug('Iniciando cálculo con tramos:', tramos);

// Línea 125: console.log('Evaluando tramo:', tramo);
logger.debug('Evaluando tramo:', tramo);

// Línea 132: console.log('Tramos disponibles encontrados:', tramosDisponibles);
logger.debug('Tramos disponibles encontrados:', tramosDisponibles);

// Línea 136: console.log('No se encontraron tramos. Datos de búsqueda:', {
logger.debug('No se encontraron tramos. Datos de búsqueda:', {

// Línea 147: console.log('Tramos vigentes:', tramosVigentes);
logger.debug('Tramos vigentes:', tramosVigentes);

// Línea 155: console.log('Usando tramo vigente:', tramoAUsar);
logger.debug('Usando tramo vigente:', tramoAUsar);

// Línea 162: console.log('Usando tramo no vigente más reciente:', tramoAUsar);
logger.debug('Usando tramo no vigente más reciente:', tramoAUsar);

// Línea 188: console.log('Enviando solicitud al servidor:', requestData);
logger.debug('Enviando solicitud al servidor:', requestData);

// Línea 197: console.log('Respuesta del servidor:', response.data);
logger.debug('Respuesta del servidor:', response.data);

// Línea 207: console.error('Error completo:', error);
logger.error('Error completo:', error);

// Línea 216: console.error('Se intentó usar un tramo no vigente pero fue rechazado:', {
logger.error('Se intentó usar un tramo no vigente pero fue rechazado:', {

// Línea 223: console.error('Error con tramo no vigente, pero no se encontró información del tramo');
logger.error('Error con tramo no vigente, pero no se encontró información del tramo');

// Línea 272: console.log('Preseleccionando tramo vigente:', tramoVigenteMasReciente);
logger.debug('Preseleccionando tramo vigente:', tramoVigenteMasReciente);

// Línea 280: console.log('Preseleccionando tramo NO vigente:', tramoMasReciente);
logger.debug('Preseleccionando tramo NO vigente:', tramoMasReciente);

```

## frontend/src/components/ClientesManager.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 58: console.error('Error fetching clientes:', error);
logger.error('Error fetching clientes:', error);

// Línea 89: console.error('Error:', error);
logger.error('Error:', error);

// Línea 116: console.error('Error:', error);
logger.error('Error:', error);

// Línea 141: console.error('Error:', error);
logger.error('Error:', error);

// Línea 161: console.error('Error:', error);
logger.error('Error:', error);

```

## frontend/src/components/ClientesTable.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 18: console.log('Clientes recibidos:', response.data);
logger.debug('Clientes recibidos:', response.data);

// Línea 21: console.error('Error al obtener clientes:', error);
logger.error('Error al obtener clientes:', error);

// Línea 73: onRowClick={(row) => console.log('Cliente seleccionado:', row)}
onRowClick={(row) => logger.debug('Cliente seleccionado:', row)}

```

## frontend/src/components/DataTable.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 125: console.error('Error al restaurar preferencias:', error);
logger.error('Error al restaurar preferencias:', error);

```

## frontend/src/components/EnhancedTable.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 43: .catch(console.error);
.catch(logger.error);

// Línea 143: console.error('Error:', error);
logger.error('Error:', error);

// Línea 164: .catch(console.error);
.catch(logger.error);

// Línea 198: console.error('Error:', error);
logger.error('Error:', error);

// Línea 218: console.error('Error:', error);
logger.error('Error:', error);

// Línea 251: console.error('Error:', error);
logger.error('Error:', error);

```

## frontend/src/components/ExtrasManager.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 148: console.log('Enviando datos:', dataToSend); // Para debugging
logger.debug('Enviando datos:', dataToSend); // Para debugging

// Línea 169: console.error('Error en handleSubmit:', error);
logger.error('Error en handleSubmit:', error);

```

## frontend/src/components/SiteBulkImporter.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 38: console.error('Error en geocodificación:', error);
logger.error('Error en geocodificación:', error);

```

## frontend/src/components/SitesManager.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 30: console.log('Intentando obtener sites para cliente:', cliente);
logger.debug('Intentando obtener sites para cliente:', cliente);

// Línea 42: console.log('Respuesta completa:', response);
logger.debug('Respuesta completa:', response);

// Línea 45: console.log('Sites procesados:', sitesData);
logger.debug('Sites procesados:', sitesData);

// Línea 48: console.error('Los datos recibidos no son un array:', sitesData);
logger.error('Los datos recibidos no son un array:', sitesData);

// Línea 55: console.error('Error detallado:', error.response || error);
logger.error('Error detallado:', error.response || error);

// Línea 94: console.error('Error al eliminar:', error);
logger.error('Error al eliminar:', error);

// Línea 110: console.error('Error al actualizar:', error);
logger.error('Error al actualizar:', error);

```

## frontend/src/components/TarifarioViewer.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 198: console.log('Aplicando filtros a', tramos.length, 'tramos');
logger.debug('Aplicando filtros a', tramos.length, 'tramos');

// Línea 230: console.error('Error al cargar sites:', error);
logger.error('Error al cargar sites:', error);

// Línea 241: console.log('Solicitando tramos para cliente:', cliente);
logger.debug('Solicitando tramos para cliente:', cliente);

// Línea 269: console.error('Error al cargar tramos:', error);
logger.error('Error al cargar tramos:', error);

// Línea 286: console.log('TarifarioViewer abierto para cliente:', cliente);
logger.debug('TarifarioViewer abierto para cliente:', cliente);

// Línea 318: console.error('Error al crear tramo:', error);
logger.error('Error al crear tramo:', error);

// Línea 366: console.error('Error al eliminar tramo(s):', error);
logger.error('Error al eliminar tramo(s):', error);

```

## frontend/src/components/TramosBulkImporter.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 104: console.log(`Fechas procesadas para ${origen}-${destino}: ${fechaDesde} - ${fechaHasta}`);
logger.debug(`Fechas procesadas para ${origen}-${destino}: ${fechaDesde} - ${fechaHasta}`);

// Línea 137: console.error('Error formateando fechas:', error);
logger.error('Error formateando fechas:', error);

// Línea 200: console.log('Duplicados detectados:', posiblesDuplicados);
logger.debug('Duplicados detectados:', posiblesDuplicados);

// Línea 213: console.log(`Enviando ${validRows.length} tramos en ${batches.length} lotes`);
logger.debug(`Enviando ${validRows.length} tramos en ${batches.length} lotes`);

// Línea 228: console.log(`Enviando lote ${i+1}:`, {
logger.debug(`Enviando lote ${i+1}:`, {

// Línea 248: console.log(`Respuesta del lote ${i+1}:`, response.data);
logger.debug(`Respuesta del lote ${i+1}:`, response.data);

// Línea 259: console.error(`Error en lote ${i+1}:`, batchError);
logger.error(`Error en lote ${i+1}:`, batchError);

// Línea 264: console.error('Error del servidor:', {
logger.error('Error del servidor:', {

// Línea 275: console.error('Error de red - no hubo respuesta:', batchError.request);
logger.error('Error de red - no hubo respuesta:', batchError.request);

// Línea 282: console.error('Error de configuración:', batchError.message);
logger.error('Error de configuración:', batchError.message);

// Línea 299: console.error(`Importación completada con errores: ${exitosos} exitosos, ${errores.length} fallidos`);
logger.error(`Importación completada con errores: ${exitosos} exitosos, ${errores.length} fallidos`);

// Línea 315: console.error('Detalle de errores:', errores);
logger.error('Detalle de errores:', errores);

// Línea 318: console.error("Muestra de errores:", errores.slice(0, 5).map(e => ({
logger.error("Muestra de errores:", errores.slice(0, 5).map(e => ({

// Línea 336: console.error("Recuento de errores por tipo:", errorPorTipos);
logger.error("Recuento de errores por tipo:", errorPorTipos);

// Línea 342: console.log(`Importación exitosa: ${exitosos} tramos importados`);
logger.debug(`Importación exitosa: ${exitosos} tramos importados`);

// Línea 352: console.error('Error general en importación:', err);
logger.error('Error general en importación:', err);

```

## frontend/src/components/ViajesManager.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 46: console.error('Error al obtener viajes:', error);
logger.error('Error al obtener viajes:', error);

```

## frontend/src/components/ViajesTable.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 16: console.log('Viajes recibidos:', response.data);
logger.debug('Viajes recibidos:', response.data);

// Línea 19: console.error('Error al obtener viajes:', error);
logger.error('Error al obtener viajes:', error);

```

## frontend/src/context/AuthContext.js

```javascript
// Añadir al principio del archivo
import logger from '../utils/logger';

// Reemplazar las siguientes líneas:

// Línea 36: console.error('Error al verificar autenticación:', error);
logger.error('Error al verificar autenticación:', error);

// Línea 56: console.error('Error en login:', error);
logger.error('Error en login:', error);

```

## frontend/src/index.js

```javascript
// Añadir al principio del archivo
import logger from 'utils/logger';

// Reemplazar las siguientes líneas:

// Línea 19: // to log results (for example: reportWebVitals(console.log))
// to log results (for example: reportWebVitals(logger.debug))

```

## frontend/src/utils/errorHandler.js

```javascript
// Añadir al principio del archivo
import logger from './utils/logger';

// Reemplazar las siguientes líneas:

// Línea 2: console.error('API Error:', error);
logger.error('API Error:', error);

```

