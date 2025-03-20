/**
 * Web Worker para procesar archivos Excel
 * Este worker permite procesar grandes cantidades de datos sin bloquear el hilo principal
 */

// Función para evaluar una función de validación en formato string
const evaluateValidation = (functionString, row, index) => {
  // eslint-disable-next-line no-new-func
  const validationFunction = new Function('return ' + functionString)();
  return validationFunction(row, index);
};

// Mensaje principal recibido del hilo principal
self.onmessage = function(e) {
  const { data, validateRowFn, action, batchSize = 50 } = e.data;
  
  switch (action) {
    case 'validate': {
      processValidation(data, validateRowFn, batchSize);
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
 */
function processValidation(data, validateRowFn, batchSize) {
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
            const rowErrors = evaluateValidation(validateRowFn, row, i);
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