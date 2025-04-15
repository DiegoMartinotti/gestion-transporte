import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  LinearProgress
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import logger from '../../utils/logger';

/**
 * Componente base optimizado para importación de datos mediante Excel
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.title='Importación mediante Excel'] - Título del diálogo
 * @param {boolean} props.open - Estado de apertura del diálogo
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {Function} [props.onComplete] - Función a ejecutar al completar el proceso
 * @param {Array<{field: string, label: string, required: boolean}>} [props.excelHeaders=[]] - Definición de columnas para el Excel
 * @param {Function} [props.processDataCallback] - Función para procesar los datos del Excel
 * @param {Function} [props.generateTemplateCallback] - Función personalizada para generar la plantilla
 * @param {string} [props.templateFileName='Plantilla_Importacion.xlsx'] - Nombre del archivo de plantilla
 * @param {Function} [props.validateRow] - Función para validar cada fila
 * @param {Array<{name: string, data: Array<Array<string>>, columnWidths: Array<{wch: number}>}>} [props.instructionSheets=[]] - Hojas adicionales para instrucciones
 * @param {React.ReactNode} [props.additionalContent] - Contenido adicional para mostrar en el diálogo
 * @param {Array<Object>} [props.exampleData=[]] - Datos de ejemplo para incluir en la plantilla
 * @param {any} [props.validationContext=null] - Contexto de validación para el worker
 * @returns {React.ReactElement} Componente ExcelImportTemplate
 */
const ExcelImportTemplate = ({ 
  title = 'Importación mediante Excel',
  open, 
  onClose, 
  onComplete,
  excelHeaders = [], 
  processDataCallback,
  generateTemplateCallback,
  templateFileName = 'Plantilla_Importacion.xlsx',
  validateRow,
  instructionSheets = [],
  additionalContent,
  additionalActions,
  exampleData = [],
  validationContext = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  // Inicializar Web Worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        // Crear worker de forma dinámica
        workerRef.current = new Worker(new URL('../../workers/excelWorker.js', import.meta.url));
        
        // Configurar el evento de mensaje del worker
        workerRef.current.onmessage = (e) => {
          const { type, progress, status, validRows, errors, transformedData, error: workerError } = e.data;
          
          switch (type) {
            case 'progress':
              setProgress(progress);
              setProcessingStatus(status);
              break;
            case 'complete':
              if (errors) {
                setError(errors);
                setLoading(false);
              } else if (validRows) {
                // Si el worker validó los datos correctamente, procesarlos
                handleProcessValidData(validRows);
              } else if (transformedData) {
                // Si el worker transformó los datos, seguir con el procesamiento
                if (processDataCallback) {
                  processDataCallback(transformedData)
                    .then(() => {
                      // El processDataCallback maneja su propio cierre y notificaciones
                      setLoading(false);
                    })
                    .catch(error => {
                      logger.error('Error en callback de procesamiento:', error);
                      setError([`Error al procesar los datos: ${error.message}`]);
                      setLoading(false);
                    });
                } else {
                  setLoading(false);
                }
              }
              setProgress(100);
              setProcessingStatus('Procesamiento completado');
              break;
            case 'error':
              setLoading(false);
              setError([workerError]);
              break;
            default:
              break;
          }
        };
      } catch (error) {
        logger.error('Error al inicializar Web Worker:', error);
        // Si falla la creación del worker, estableceremos una bandera para procesamiento síncrono
      }
    }
    
    // Limpieza al desmontar
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Procesar datos validados por el worker
  const handleProcessValidData = useCallback(async (validRows) => {
    try {
      if (processDataCallback) {
        setProcessingStatus('Enviando datos al servidor...');
        await processDataCallback(validRows);
      }
      setLoading(false);
    } catch (error) {
      logger.error('Error en callback de procesamiento:', error);
      setError([`Error al procesar los datos: ${error.message}`]);
      setLoading(false);
    }
  }, [processDataCallback]);

  // Función para descargar la plantilla Excel
  const handleDownloadTemplate = useCallback(() => {
    try {
      // Si hay una función personalizada para generar la plantilla, úsala
      if (generateTemplateCallback) {
        generateTemplateCallback();
        return;
      }

      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();

      // Crear la hoja principal con los encabezados
      const wsData = XLSX.utils.json_to_sheet([{}]);
      XLSX.utils.sheet_add_aoa(wsData, [excelHeaders.map(header => header.label)], { origin: 'A1' });
      
      // Ajustar el ancho de las columnas
      const wscols = excelHeaders.map(() => ({ wch: 20 }));
      wsData['!cols'] = wscols;
      
      // Agregar la hoja principal al libro
      XLSX.utils.book_append_sheet(wb, wsData, "Datos");

      // Si hay datos de ejemplo, agregarlos a la hoja principal
      if (exampleData && exampleData.length > 0) {
        const exampleRows = exampleData.map(row => {
          // Mapear los datos al orden de las columnas
          const orderedRow = {};
          excelHeaders.forEach(header => {
            orderedRow[header.field] = row[header.field] || '';
          });
          return orderedRow;
        });
        
        XLSX.utils.sheet_add_json(wsData, exampleRows, { origin: 'A2', skipHeader: true });
      }

      // Agregar hojas de instrucciones adicionales si existen
      if (instructionSheets && instructionSheets.length > 0) {
        instructionSheets.forEach(sheet => {
          if (sheet.data && sheet.name) {
            const wsSheet = XLSX.utils.aoa_to_sheet(sheet.data);
            if (sheet.columnWidths) {
              wsSheet['!cols'] = sheet.columnWidths;
            }
            XLSX.utils.book_append_sheet(wb, wsSheet, sheet.name);
          }
        });
      }

      // Descargar el archivo
      XLSX.writeFile(wb, templateFileName);
    } catch (error) {
      logger.error('Error al generar la plantilla Excel:', error);
      setError([`Error al generar la plantilla Excel: ${error.message}`]);
    }
  }, [excelHeaders, generateTemplateCallback, instructionSheets, templateFileName, exampleData]);

  // Procesar el archivo Excel
  const processExcelFile = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setProcessingStatus('Leyendo archivo Excel...');
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          
          // Validar formato del archivo Excel
          let workbook;
          try {
            workbook = XLSX.read(data, { type: 'array' });
          } catch (excelError) {
            throw new Error(`Formato de archivo Excel inválido: ${excelError.message}`);
          }
          
          // Verificar que exista al menos una hoja
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('El archivo Excel no contiene hojas de cálculo');
          }
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: excelHeaders.map(h => h.field) });
          
          setProcessingStatus('Analizando estructura del archivo...');
          
          // Eliminar la fila de encabezados si existe
          if (jsonData.length > 0 && Object.values(jsonData[0]).some(val => 
            excelHeaders.some(header => header.label === val))) {
            jsonData.shift();
          }
          
          // --- Limpieza de datos numéricos (reemplazar comas) ---
          jsonData.forEach(row => {
            if (typeof row.valor === 'string') {
              row.valor = row.valor.replace(',', '.');
            }
            if (typeof row.valorPeaje === 'string') {
              row.valorPeaje = row.valorPeaje.replace(',', '.');
            }
            // También podríamos convertir a número aquí, pero parseFloat en la validación debería bastar
          });
          // --- Fin Limpieza ---
          
          if (jsonData.length === 0) {
            throw new Error('El archivo no contiene datos para importar');
          }
          
          setProcessingStatus('Validando datos...');
          
          // Si tenemos Web Worker disponible y muchas filas, usar el worker
          if (workerRef.current && jsonData.length > 10) {
            // Usar Web Worker para procesamiento asíncrono
            workerRef.current.postMessage({
              action: 'validate',
              data: jsonData,
              validateRowFn: validateRow ? validateRow.toString() : null,
              excelHeaders: excelHeaders,
              validationContext: validationContext,
              batchSize: 50 // Procesar en lotes de 50 filas
            });
          } else {
            // Procesamiento síncrono para pocos datos o si no hay worker
            const errors = [];
            const validRows = [];
            
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i];
              // Validar si es necesario
              if (validateRow) {
                try {
                  const rowErrors = validateRow(row, i, excelHeaders, validationContext);
                  if (rowErrors && rowErrors.length > 0) {
                    errors.push(...rowErrors);
                  } else {
                    validRows.push(row);
                  }
                } catch (error) {
                  errors.push(`Error en validación de fila ${i + 1}: ${error.message}`);
                }
              } else {
                validRows.push(row);
              }
              
              // Actualizar progreso cada 10 filas o en la última
              if ((i + 1) % 10 === 0 || i === jsonData.length - 1) {
                setProgress(Math.round(((i + 1) / jsonData.length) * 100));
              }
            }
            
            if (errors.length > 0) {
              setError(errors);
              setLoading(false);
            } else {
              // Procesar datos validados
              await handleProcessValidData(validRows);
            }
          }
        } catch (error) {
          logger.error('Error al procesar el archivo Excel:', error);
          setError([`Error al procesar el archivo Excel: ${error.message}`]);
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError(['Error al leer el archivo']);
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      logger.error('Error al procesar el archivo:', error);
      setError([`Error al procesar el archivo: ${error.message}`]);
      setLoading(false);
    }
  }, [excelHeaders, validateRow, handleProcessValidData, validationContext]);

  // Función para manejar la carga del archivo
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar extensión del archivo
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'xlsx' && fileExt !== 'xls') {
        setError(['El archivo debe ser un documento Excel (.xlsx, .xls)']);
        return;
      }
      
      // Validar tamaño del archivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(['El archivo es demasiado grande. El tamaño máximo permitido es 10MB']);
        return;
      }
      
      processExcelFile(file);
    }
  }, [processExcelFile]);

  const handleClose = useCallback(() => {
    setError(null);
    setLoading(false);
    setProgress(0);
    setProcessingStatus('');
    setFileKey(Date.now()); // Resetear el input de archivo
    if (onClose) onClose();
  }, [onClose]);

  // Renderizar el mensaje de error de manera eficiente
  const errorContent = useMemo(() => {
    if (!error) return null;
    
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {Array.isArray(error) ? (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Se encontraron {error.length} errores:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
              {error.slice(0, 10).map((err, index) => (
                <li key={index}>{err}</li>
              ))}
              {error.length > 10 && (
                <li>... y {error.length - 10} errores más</li>
              )}
            </Box>
          </>
        ) : (
          error
        )}
      </Alert>
    );
  }, [error]);

  return (
    <Dialog 
      open={open} 
      onClose={!loading ? onClose : undefined} 
      fullWidth 
      maxWidth="md"
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {Array.isArray(error) ? (
              <ul>
                {error.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            ) : (
              error
            )}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ width: '100%', mb: 2, mt: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {processingStatus}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mb: 2, mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Para importar datos, siga estos pasos:
          </Typography>
          <Typography component="div" variant="body2">
            <ol>
              <li>Descargue la plantilla de Excel haciendo clic en el botón "Descargar Plantilla"</li>
              <li>Complete los datos en la hoja "Datos"</li>
              <li>Guarde el archivo y cárguelo usando el botón "Seleccionar Archivo"</li>
            </ol>
          </Typography>
        </Box>
        
        {additionalContent}
        
        <input
          type="file"
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileUpload}
          key={fileKey} // Para resetear el input después de cargar
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          {additionalActions}
        </Box>
        <Box>
          <Button
            onClick={handleDownloadTemplate}
            startIcon={<DownloadIcon />}
            color="secondary"
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Descargar Plantilla
          </Button>
          <Button
            onClick={() => fileInputRef.current.click()}
            startIcon={<UploadIcon />}
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Seleccionar Archivo
          </Button>
          <Button 
            onClick={onClose} 
            disabled={loading}
          >
            Cerrar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// Validación de PropTypes
ExcelImportTemplate.propTypes = {
  /** Título del diálogo */
  title: PropTypes.string,
  /** Estado de apertura del diálogo */
  open: PropTypes.bool.isRequired,
  /** Función para cerrar el diálogo */
  onClose: PropTypes.func.isRequired,
  /** Función a ejecutar al completar el proceso */
  onComplete: PropTypes.func,
  /** Definición de columnas para el Excel */
  excelHeaders: PropTypes.arrayOf(
    PropTypes.shape({
      /** Identificador del campo */
      field: PropTypes.string.isRequired,
      /** Etiqueta a mostrar en el Excel */
      label: PropTypes.string.isRequired,
      /** Indica si el campo es requerido */
      required: PropTypes.bool
    })
  ),
  /** Función para procesar los datos del Excel */
  processDataCallback: PropTypes.func,
  /** Función personalizada para generar la plantilla */
  generateTemplateCallback: PropTypes.func,
  /** Nombre del archivo de plantilla */
  templateFileName: PropTypes.string,
  /** Función para validar cada fila */
  validateRow: PropTypes.func,
  /** Hojas adicionales para instrucciones */
  instructionSheets: PropTypes.arrayOf(
    PropTypes.shape({
      /** Nombre de la hoja */
      name: PropTypes.string.isRequired,
      /** Datos de la hoja */
      data: PropTypes.array.isRequired,
      /** Anchos de columna */
      columnWidths: PropTypes.array
    })
  ),
  /** Contenido adicional para mostrar en el diálogo */
  additionalContent: PropTypes.node,
  /** Botones de acción adicionales */
  additionalActions: PropTypes.node,
  /** Datos de ejemplo para incluir en la plantilla */
  exampleData: PropTypes.array,
  /** Contexto de validación para el worker */
  validationContext: PropTypes.any
};

export default ExcelImportTemplate; 