/**
 * Web Worker para procesar archivos Excel
 * Este worker permite procesar grandes cantidades de datos sin bloquear el hilo principal
 */

// Función para evaluar una función de validación en formato string
const evaluateValidation = (functionString, row, index, EXCEL_HEADERS, sitesMap) => {
  // eslint-disable-next-line no-new-func
  const validationFunction = new Function('row', 'index', 'EXCEL_HEADERS', 'validationContext', 'return (' + functionString + ')(row, index, EXCEL_HEADERS, validationContext)');
  return validationFunction(row, index, EXCEL_HEADERS, sitesMap);
};

/**
 * Función auxiliar para normalizar texto (eliminar espacios, acentos, convertir a minúsculas)
 * @param {string} text - Texto a normalizar
 * @returns {string} - Texto normalizado
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // Eliminar espacios en blanco adicionales y convertir a minúsculas
  const trimmed = text.trim().toLowerCase();
  
  // Eliminar acentos y caracteres especiales
  return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// --- Funciones de Ayuda para Validación (Replicadas y usadas en construcción del mapa) ---
const getSiteName = (site) => {
    // 1. Prioridad: Campo 'nombre' del modelo
    if (site && typeof site.nombre === 'string' && site.nombre.trim() !== '') {
        return site.nombre.trim();
    }
    // 2. Fallback: Campo 'Site' (común desde Excel/importación)
    if (site && typeof site.Site === 'string' && site.Site.trim() !== '') {
        return site.Site.trim();
    }
    // 3. Fallback: Campo 'name' (otro posible estándar)
    if (site && typeof site.name === 'string' && site.name.trim() !== '') {
        return site.name.trim();
    }
    // Si no se encuentra un nombre válido
    return ''; // O podrías devolver un valor por defecto como 'Nombre Desconocido'
};

const parseSpanishNumber = (value) => {
    if (!value) return 0;
    const normalizedValue = String(value).replace(',', '.');
    return parseFloat(normalizedValue) || 0;
};
// --- Fin Funciones de Ayuda ---

// Mensaje principal recibido del hilo principal
self.onmessage = function(e) {
  const { data, action, batchSize = 50, excelHeaders, validationContext } = e.data;
  
  switch (action) {
    case 'validate': {
      processValidation(data, batchSize, excelHeaders, validationContext);
      break;
    }
    case 'transform': {
      processTransformation(data, e.data.transformFn, batchSize);
      break;
    }
    default: {
      self.postMessage({ 
        type: 'error', 
        error: 'Acción desconocida: ' + action 
      });
    }
  }
};

/**
 * Procesa la validación de los datos en lotes
 * @param {Array} data - Los datos a validar
 * @param {number} batchSize - Tamaño del lote para procesar
 * @param {Array} excelHeaders - Definición de las cabeceras del Excel
 * @param {any} validationContext - Contexto adicional (array 'sites')
 */
function processValidation(data, batchSize, excelHeaders, validationContext) {
  // --- Construir sitesMap desde validationContext (array sites) ---
  const sitesMap = {};
  const sites = validationContext || []; // Usar el array recibido o uno vacío

  console.log('[Worker] Iniciando validación. Total Sites recibidos:', Array.isArray(sites) ? sites.length : 'No es array');
  console.log('[Worker] ValidationContext recibido (primeros 5): ', JSON.stringify(sites.slice(0, 5))); 

  if (Array.isArray(sites)) {
    console.log('[Worker] Procesando sitios para crear sitesMap...');
    sites.forEach((site, idx) => {
      const siteName = getSiteName(site); // Usa Site o nombre
      
      if (siteName) { 
        const siteNameLower = siteName.toLowerCase();
        const normalizedName = normalizeText(siteName);
        const siteCode = site?.Codigo?.trim();
        const siteCodeLower = siteCode?.toLowerCase();
        
        // Añadir todas las claves relevantes, sobrescribiendo si es necesario (apuntan al mismo objeto)
        sitesMap[siteName] = site; // Clave Original (e.g., "ZARATE")
        sitesMap[siteNameLower] = site; // Clave Minúsculas (e.g., "zarate")
        if (normalizedName !== siteNameLower) { // Solo añadir normalizada si es diferente de minúsculas
            sitesMap[normalizedName] = site; 
        }
        if (siteCode) {
            sitesMap[siteCode] = site; // Código Original
            sitesMap[siteCodeLower] = site; // Código Minúsculas
        }

        // Log de verificación INMEDIATA para ZARATE
        if (siteName === 'ZARATE') {
            console.log(`[Worker] CONSTRUCCIÓN MAPA - Sitio ZARATE (Index ${idx}):`);
            console.log(`  - ¿sitesMap["ZARATE"] existe?`, sitesMap.hasOwnProperty("ZARATE"));
            console.log(`  - ¿sitesMap["zarate"] existe?`, sitesMap.hasOwnProperty("zarate"));
            if (siteCode) {
                 console.log(`  - ¿sitesMap["${siteCode}"] existe?`, sitesMap.hasOwnProperty(siteCode));
                 console.log(`  - ¿sitesMap["${siteCodeLower}"] existe?`, sitesMap.hasOwnProperty(siteCodeLower));
            }
        }
        // Log detallado anterior (opcional ahora, pero lo dejamos por si acaso)
        // if (siteName.toUpperCase().includes('ZARATE') || siteName.toUpperCase().includes('CORRIENTES')) {
        //      console.log(`[Worker] Sitio ${siteName} (Index ${idx}): Claves añadidas a sitesMap: ...`);
        // }
      } else {
        // Log si un sitio es inválido o no tiene nombre usable
         console.warn(`[Worker] Sitio en índice ${idx} ignorado (sin nombre válido en 'Site' o 'nombre'):`, site);
      }
    });
    console.log('[Worker] Fin procesamiento sitios.');
  } else if (typeof sites === 'object' && sites !== null) {
    Object.assign(sitesMap, sites);
  }
  
  console.log('[Worker] SitesMap construido con éxito. Total claves:', Object.keys(sitesMap).length);
  // Log de algunas claves del sitesMap para verificar
  console.log('[Worker] Clave "CTE-CORRIENTES" (Upper) en sitesMap?', sitesMap.hasOwnProperty('CTE-CORRIENTES'));
  console.log('[Worker] Clave "cte-corrientes" (Lower) en sitesMap?', sitesMap.hasOwnProperty('cte-corrientes'));
  console.log('[Worker] Clave "siasa" en sitesMap?', sitesMap.hasOwnProperty('siasa'));
  console.log('[Worker] Clave "quilmes" en sitesMap?', sitesMap.hasOwnProperty('quilmes'));

  let processedRows = 0;
  const totalRows = data.length;
  const errors = [];
  const validRows = [];
  
  try {
    // Función para procesar un lote de filas
    const processBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, totalRows);
      
      // Procesar filas en el lote actual
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const row = data[i];
          const rowIndexForError = i + 1; // User-friendly index (1-based)
          const rowErrors = [];

          // --- INICIO: Lógica de validación (Replicada de ViajeBulkImporter.validateRow) ---
          // Validar campos requeridos
          excelHeaders.forEach(header => {
            if (header.required && !row[header.field] && header.field !== 'paletas') {
              rowErrors.push(`Fila ${rowIndexForError}: El campo ${header.label} es requerido`);
            }
          });
          
          // Validar sitios existentes
          if (row.origen) {
            const origenInput = String(row.origen);
            const origenLower = origenInput.toLowerCase();
            const origenNormalized = normalizeText(origenInput);
            
            // --- Inicio: Logs de depuración para origen ---
            console.log(`[Worker] Fila ${rowIndexForError} - Validando Origen:`);
            console.log(`  - Input Excel (row.origen):`, row.origen);
            console.log(`  - Clave Original (origenInput): "${origenInput}"`);
            console.log(`  - Clave Minúsculas (origenLower): "${origenLower}"`);
            console.log(`  - Clave Normalizada (origenNormalized): "${origenNormalized}"`);
            console.log(`  - Existe en sitesMap[Original]?`, sitesMap.hasOwnProperty(origenInput));
            console.log(`  - Existe en sitesMap[Minúsculas]?`, sitesMap.hasOwnProperty(origenLower));
            console.log(`  - Existe en sitesMap[Normalizada]?`, sitesMap.hasOwnProperty(origenNormalized));
            // --- Fin: Logs de depuración para origen ---
            
            // Buscar usando original, minúsculas y normalizado
            if (!sitesMap[origenInput] && !sitesMap[origenLower] && !sitesMap[origenNormalized]) {
              rowErrors.push(`Fila ${rowIndexForError}: Sitio de origen "${row.origen}" no encontrado`);
            }
          } else if (excelHeaders.find(h => h.field === 'origen' && h.required)) {
             // Añadir error si es requerido y está vacío (esto ya lo cubre la validación de requeridos)
             // rowErrors.push(`Fila ${rowIndexForError}: El campo Origen* es requerido`);
          }
          
          if (row.destino) {
            const destinoInput = String(row.destino);
            const destinoLower = destinoInput.toLowerCase();
            const destinoNormalized = normalizeText(destinoInput);

            // --- Inicio: Logs de depuración para destino ---
            console.log(`[Worker] Fila ${rowIndexForError} - Validando Destino:`);
            console.log(`  - Input Excel (row.destino):`, row.destino);
            console.log(`  - Clave Original (destinoInput): "${destinoInput}"`);
            console.log(`  - Clave Minúsculas (destinoLower): "${destinoLower}"`);
            console.log(`  - Clave Normalizada (destinoNormalized): "${destinoNormalized}"`);
            console.log(`  - Existe en sitesMap[Original]?`, sitesMap.hasOwnProperty(destinoInput));
            console.log(`  - Existe en sitesMap[Minúsculas]?`, sitesMap.hasOwnProperty(destinoLower));
            console.log(`  - Existe en sitesMap[Normalizada]?`, sitesMap.hasOwnProperty(destinoNormalized));
            // --- Fin: Logs de depuración para destino ---
            
            // Buscar usando original, minúsculas y normalizado
            if (!sitesMap[destinoInput] && !sitesMap[destinoLower] && !sitesMap[destinoNormalized]) {
              rowErrors.push(`Fila ${rowIndexForError}: Sitio de destino "${row.destino}" no encontrado`);
            }
          } else if (excelHeaders.find(h => h.field === 'destino' && h.required)) {
            // Añadir error si es requerido y está vacío
             // rowErrors.push(`Fila ${rowIndexForError}: El campo Destino* es requerido`);
          }
          
          // Validar formato de fecha
          if (row.fecha) {
            const fechaRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (!fechaRegex.test(String(row.fecha))) {
              rowErrors.push(`Fila ${rowIndexForError}: Formato de fecha inválido. Use DD/MM/YYYY`);
            }
          }
          
          // Validar formato de Vehículos (cadena no vacía)
          if (row.vehiculo && typeof row.vehiculo === 'string' && row.vehiculo.trim() === '') {
            rowErrors.push(`Fila ${rowIndexForError}: El campo Vehículos no puede estar vacío.`);
          } else if (row.vehiculo) {
            const patentes = String(row.vehiculo).split(',').map(p => p.trim()).filter(p => p !== '');
            if (patentes.length === 0) {
                rowErrors.push(`Fila ${rowIndexForError}: Debe ingresar al menos una patente válida en Vehículos.`);
            }
          }

          // Validar valores numéricos para paletas si se proporciona
          if (row.paletas && row.paletas !== '' && isNaN(parseSpanishNumber(row.paletas))) {
            rowErrors.push(`Fila ${rowIndexForError}: El valor de paletas debe ser un número`);
          }
          // --- FIN: Lógica de validación --- 

          // Acumular errores o añadir fila válida
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            validRows.push(row);
          }
        } catch (error) {
          // Capturar errores inesperados durante la validación de una fila específica
          errors.push(`Error procesando fila ${i + 1}: ${error.message}`);
        }
      }
      
      // Actualizar progreso
      processedRows = endIndex;
      const progress = Math.round((processedRows / totalRows) * 100);
      
      // Informar progreso
      self.postMessage({ 
        type: 'progress', 
        progress,
        status: `Procesando fila ${processedRows} de ${totalRows}`,
        currentBatch: {
          start: startIndex,
          end: endIndex - 1
        }
      });
      
      // Si hay más filas por procesar, programar el siguiente lote
      if (processedRows < totalRows) {
        setTimeout(() => processBatch(endIndex), 0);
      } else {
        // Completado
        self.postMessage({ 
          type: 'complete', 
          validRows,
          errors: errors.length > 0 ? errors : null,
          totalProcessed: processedRows
        });
      }
    };
    
    // Iniciar procesamiento con el primer lote
    processBatch(0);
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: `Error en procesamiento de validación: ${error.message}` 
    });
  }
}

/**
 * Aplica una función de transformación a los datos en lotes
 * @param {Array} data - Los datos a transformar
 * @param {string} transformFn - Función de transformación serializada como string
 * @param {number} batchSize - Tamaño del lote para procesar
 */
function processTransformation(data, transformFn, batchSize) {
  let processedRows = 0;
  const totalRows = data.length;
  const transformedData = [];
  
  // Función auxiliar para evaluar la transformación (si es necesaria)
  const evaluateTransform = (functionString, row, index) => {
    // eslint-disable-next-line no-new-func
    const func = new Function('row', 'index', 'return (' + functionString + ')(row, index)');
    return func(row, index);
  };

  try {
    // Función para procesar un lote de filas
    const processBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, totalRows);
      
      // Procesar filas en el lote actual
      for (let i = startIndex; i < endIndex; i++) {
        try {
          const row = data[i];
          
          // Transformar la fila
          if (transformFn) {
            // Declarar y asignar transformedRow aquí
            const transformedRow = evaluateTransform(transformFn, row, i);
            transformedData.push(transformedRow);
          } else {
            // Si no hay transformación, añadir la fila original
            transformedData.push(row);
          }
        } catch (error) {
          self.postMessage({ 
            type: 'error', 
            error: `Error en transformación de fila ${i + 1}: ${error.message}` 
          });
          return; // Detener si hay error en una fila
        }
      }
      
      // Actualizar progreso
      processedRows = endIndex;
      const progress = Math.round((processedRows / totalRows) * 100);
      
      // Informar progreso
      self.postMessage({ 
        type: 'progress', 
        progress,
        status: `Transformando fila ${processedRows} de ${totalRows}`,
        currentBatch: {
          start: startIndex,
          end: endIndex - 1
        }
      });
      
      // Si hay más filas por procesar, programar el siguiente lote
      if (processedRows < totalRows) {
        setTimeout(() => processBatch(endIndex), 0);
      } else {
        // Completado
        self.postMessage({ 
          type: 'complete', 
          transformedData,
          totalProcessed: processedRows
        });
      }
    };
    
    // Iniciar procesamiento con el primer lote
    processBatch(0);
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: `Error en procesamiento de transformación: ${error.message}` 
    });
  }
} 