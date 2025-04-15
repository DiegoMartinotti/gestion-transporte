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

// Mensaje principal recibido del hilo principal
self.onmessage = function(e) {
  const { data, validateRowFn, action, batchSize = 50, excelHeaders, validationContext } = e.data;
  
  switch (action) {
    case 'validate': {
      processValidation(data, validateRowFn, batchSize, excelHeaders, validationContext);
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
 * @param {string} validateRowFn - Función de validación serializada como string
 * @param {number} batchSize - Tamaño del lote para procesar
 * @param {Array} excelHeaders - Definición de las cabeceras del Excel
 * @param {any} validationContext - Contexto adicional (array 'sites')
 */
function processValidation(data, validateRowFn, batchSize, excelHeaders, validationContext) {
  // --- Construir sitesMap desde validationContext (array sites) ---
  const sitesMap = {};
  const sites = validationContext || []; // Usar el array recibido o uno vacío

  console.log('[Worker] Iniciando validación. Total Sites recibidos:', Array.isArray(sites) ? sites.length : 'No es array');
  // Log detallado del validationContext recibido
  console.log('[Worker] ValidationContext recibido:', JSON.stringify(sites.slice(0, 5))); // Loguear los primeros 5 para inspección

  // Determinar si validationContext ya es un objeto mapa o un array de sitios
  if (Array.isArray(sites)) {
    // Es un array de sitios, construir el mapa
    console.log('[Worker] Procesando sitios para crear sitesMap...'); // Log inicio bucle
    sites.forEach((site, idx) => {
      // Log para cada sitio procesado
      // console.log(`[Worker] Index ${idx}: Procesando sitio ${site?.Site || '(Sin Site)'}`); 
      
      if (site && typeof site.Site === 'string') {
        const siteNameUpper = site.Site; 
        const keysAdded = []; // Rastrear claves añadidas para este sitio
        
        // 1. Agregar por nombre original (MAYÚSCULAS)
        sitesMap[siteNameUpper] = site;
        keysAdded.push(siteNameUpper);
        
        // 2. Agregar por nombre normalizado (minúsculas, sin acentos)
        const normalizedName = normalizeText(siteNameUpper); 
        if (normalizedName !== siteNameUpper.toLowerCase()) { 
          sitesMap[normalizedName] = site;
          keysAdded.push(normalizedName);
        }
        // Agregar también la versión en minúsculas del nombre original si es diferente de la normalizada y no existe ya
        const siteNameLower = siteNameUpper.toLowerCase();
        if (siteNameLower !== normalizedName && !sitesMap.hasOwnProperty(siteNameLower)) {
           sitesMap[siteNameLower] = site;
           keysAdded.push(siteNameLower);
        } else if (!sitesMap.hasOwnProperty(siteNameLower)) { // Asegurarse que la minúscula exista si es igual a la normalizada
            sitesMap[siteNameLower] = site;
            keysAdded.push(siteNameLower);
        }
        
        // 3. Agregar por código (Codigo con C mayúscula) si existe
        if (site.Codigo && typeof site.Codigo === 'string') {
          const siteCode = site.Codigo.trim(); 
          if (siteCode) { 
            const siteCodeLower = siteCode.toLowerCase();
            sitesMap[siteCodeLower] = site; 
            keysAdded.push(siteCodeLower);
            if (siteCode !== siteCodeLower) {
                sitesMap[siteCode] = site;
                keysAdded.push(siteCode);
            }
          }
        }
        // Log detallado SOLO para el sitio problemático o uno similar
        if (siteNameUpper.includes('CORRIENTES')) {
             console.log(`[Worker] Sitio ${siteNameUpper} (Index ${idx}): Claves añadidas a sitesMap: [${keysAdded.join(', ')}]`);
        }

      } else {
        // console.warn(`[Worker] Sitio en índice ${idx} no tiene campo 'Site' o no es string:`, site);
      }
    });
    console.log('[Worker] Fin procesamiento sitios.'); // Log fin bucle
  } else if (typeof sites === 'object' && sites !== null) {
    // Ya es un objeto mapa, usarlo directamente
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
          
          // Validar la fila si hay función de validación
          if (validateRowFn) {
            const rowErrors = evaluateValidation(validateRowFn, row, i, excelHeaders, sitesMap);
            if (rowErrors && rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              validRows.push(row);
            }
          } else {
            validRows.push(row);
          }
        } catch (error) {
          errors.push(`Error en fila ${i + 1}: ${error.message}`);
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
      error: `Error en procesamiento: ${error.message}` 
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
            const transformedRow = evaluateValidation(transformFn, row, i);
            transformedData.push(transformedRow);
          } else {
            transformedData.push(row);
          }
        } catch (error) {
          self.postMessage({ 
            type: 'error', 
            error: `Error en transformación de fila ${i + 1}: ${error.message}` 
          });
          return;
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
      error: `Error en procesamiento: ${error.message}` 
    });
  }
} 