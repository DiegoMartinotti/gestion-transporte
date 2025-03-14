import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TableContainer, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, Alert, Typography, Box, TextField,
  LinearProgress, CircularProgress, Tooltip, IconButton,
  Grid, Divider
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import logger from '../utils/logger';

// Columnas del Excel para la carga masiva
const EXCEL_HEADERS = [
  { key: 'origen', label: 'Origen *' },
  { key: 'destino', label: 'Destino *' },
  { key: 'tipo', label: 'Tipo de Tramo *' },
  { key: 'metodoCalculo', label: 'Método de Cálculo *' },
  { key: 'valor', label: 'Valor *' },
  { key: 'valorPeaje', label: 'Valor Peaje' },
  { key: 'vigenciaDesde', label: 'Vigencia Desde (DD/MM/YYYY) *' },
  { key: 'vigenciaHasta', label: 'Vigencia Hasta (DD/MM/YYYY) *' }
];

// Valores predefinidos para referencia
const VALORES_PREDEFINIDOS = {
  tiposTramo: [
    'TRMC',
    'TRMI'
  ],
  metodosCalculo: [
    'Kilometro',
    'Palet',
    'Fijo'
  ],
  formatoFechas: 'DD/MM/YYYY',
  ejemplos: {
    valor: 'Número (ej: 1500.50)',
    valorPeaje: 'Número (ej: 500.00)',
  }
};

const TramosExcelImporter = ({ open, onClose, cliente, onComplete, sites }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [distanciasExistentes, setDistanciasExistentes] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  // Cargar distancias existentes cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      cargarDistanciasExistentes();
    }
  }, [open]);

  // Función para cargar distancias existentes
  const cargarDistanciasExistentes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.get(
        '/api/tramos/distancias',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Crear un mapa de distancias por origen-destino
        const distanciasMap = {};
        response.data.data.forEach(item => {
          const key = `${item.origen}-${item.destino}`;
          distanciasMap[key] = item.distancia;
        });
        setDistanciasExistentes(distanciasMap);
        logger.debug('Distancias existentes cargadas:', distanciasMap);
      }
    } catch (error) {
      logger.error('Error al cargar distancias existentes:', error);
      // No interrumpimos el flujo si falla la carga de distancias
    }
  };

  const handleClose = () => {
    setError(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadResult(null);
    onClose();
  };

  // Función para descargar la plantilla Excel
  const handleDownloadTemplate = () => {
    try {
      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();

      // Crear la hoja principal con los encabezados
      const wsData = XLSX.utils.json_to_sheet([{}]);
      XLSX.utils.sheet_add_aoa(wsData, [EXCEL_HEADERS.map(header => header.label)], { origin: 'A1' });
      
      // Obtener fechas para ejemplos
      const hoy = new Date();
      const unAnoDespues = new Date(hoy);
      unAnoDespues.setFullYear(hoy.getFullYear() + 1);
      
      // Formatear fechas para ejemplo
      const fechaDesdeEjemplo = format(hoy, 'dd/MM/yyyy');
      const fechaHastaEjemplo = format(unAnoDespues, 'dd/MM/yyyy');
      
      // Añadir una fila de ejemplo
      const ejemploRow = [
        'Planta Buenos Aires', // origen
        'Depósito Córdoba',    // destino
        'TRMC',                // tipo
        'Kilometro',           // metodoCalculo
        1500.50,               // valor
        500.00,                // valorPeaje
        fechaDesdeEjemplo,     // vigenciaDesde (formato DD/MM/YYYY)
        fechaHastaEjemplo      // vigenciaHasta (formato DD/MM/YYYY)
      ];
      XLSX.utils.sheet_add_aoa(wsData, [ejemploRow], { origin: 'A2' });
      
      // Añadir una segunda fila de ejemplo con otro método de cálculo
      const ejemploRow2 = [
        'Depósito Córdoba',    // origen
        'Planta Buenos Aires', // destino
        'TRMI',                // tipo
        'Palet',               // metodoCalculo
        250.75,                // valor
        300.00,                // valorPeaje
        fechaDesdeEjemplo,     // vigenciaDesde
        fechaHastaEjemplo      // vigenciaHasta
      ];
      XLSX.utils.sheet_add_aoa(wsData, [ejemploRow2], { origin: 'A3' });
      
      // Ajustar el ancho de las columnas en la hoja principal
      const wscols = EXCEL_HEADERS.map(() => ({ wch: 20 }));
      wsData['!cols'] = wscols;

      // Crear la hoja de sitios disponibles
      const sitesData = [
        ['SITIOS DISPONIBLES'],
        ['ID', 'Nombre'],
        ...sites.map(site => [site._id, site.Site])
      ];
      const wsSites = XLSX.utils.aoa_to_sheet(sitesData);
      
      // Crear la hoja de referencia
      const referenceData = [
        ['VALORES DE REFERENCIA'],
        [''],
        ['Tipos de Tramo Disponibles:'],
        ...VALORES_PREDEFINIDOS.tiposTramo.map(tipo => [tipo]),
        [''],
        ['Métodos de Cálculo Disponibles:'],
        ...VALORES_PREDEFINIDOS.metodosCalculo.map(metodo => [metodo]),
        [''],
        ['Formato de Fechas:'],
        [VALORES_PREDEFINIDOS.formatoFechas],
        [''],
        ['Ejemplos y Formatos:'],
        ['Campo', 'Formato/Ejemplo'],
        ['Valor', VALORES_PREDEFINIDOS.ejemplos.valor],
        ['Valor Peaje', VALORES_PREDEFINIDOS.ejemplos.valorPeaje],
        ['Vigencia Desde', `Fecha en formato ${VALORES_PREDEFINIDOS.formatoFechas} (ej: ${fechaDesdeEjemplo})`],
        ['Vigencia Hasta', `Fecha en formato ${VALORES_PREDEFINIDOS.formatoFechas} (ej: ${fechaHastaEjemplo})`],
        [''],
        ['IMPORTANTE:'],
        ['- Los nombres de los sitios deben coincidir exactamente con los nombres en la hoja "Sitios Disponibles"'],
        ['- Las fechas deben estar en formato DD/MM/YYYY'],
        ['- Los campos marcados con * son obligatorios'],
        ['- Si ya existe un tramo con el mismo origen y destino, se agregará la nueva tarifa al tramo existente'],
        ['- No se pueden agregar tarifas con fechas superpuestas para el mismo tipo y método de cálculo']
      ];

      const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
      
      // Ajustar el ancho de las columnas en la hoja de referencia
      wsReference['!cols'] = [
        { wch: 25 }, // Primera columna
        { wch: 40 }, // Segunda columna
      ];

      // Añadir estilos a los encabezados
      ['A1', 'A3', 'A6', 'A9', 'A12', 'A19'].forEach(cell => {
        if (wsReference[cell]) {
          wsReference[cell].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "CCCCCC" } }
          };
        }
      });

      // Agregar las hojas al libro
      XLSX.utils.book_append_sheet(wb, wsData, 'Plantilla Tramos');
      XLSX.utils.book_append_sheet(wb, wsSites, 'Sitios Disponibles');
      XLSX.utils.book_append_sheet(wb, wsReference, 'Valores de Referencia');

      // Guardar el archivo
      XLSX.writeFile(wb, `plantilla_tramos_${cliente}.xlsx`);
    } catch (error) {
      logger.error('Error al generar la plantilla:', error);
      setError('Error al generar la plantilla de Excel');
    }
  };

  // Función para procesar el archivo Excel cargado
  const processExcelFile = async (file) => {
    try {
      setUploadError(null);
      setUploadSuccess(false);
      setUploadResult(null);
      setLoading(true);
      setProgress(0);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: EXCEL_HEADERS.map(h => h.key) });

          // Remover la fila de encabezados si está presente
          if (jsonData.length > 0 && (typeof jsonData[0].origen !== 'string' || jsonData[0].origen.includes('*'))) {
            jsonData.shift();
          }

          if (jsonData.length === 0) {
            throw new Error('El archivo no contiene datos para importar');
          }

          // Transformar los datos al formato esperado por la API
          const tramosData = jsonData.map((row, index) => {
            // Función mejorada para convertir fechas desde diferentes formatos
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              
              // Si es un número de serie de Excel, convertirlo a fecha JavaScript
              if (typeof dateStr === 'number') {
                // Convertir el número serial de Excel a fecha JavaScript
                const excelEpoch = new Date(1899, 11, 30);
                const msPerDay = 24 * 60 * 60 * 1000;
                const excelDate = new Date(excelEpoch.getTime() + dateStr * msPerDay);
                
                // Formatear la fecha como ISO string (YYYY-MM-DD)
                return new Date(
                  excelDate.getFullYear(),
                  excelDate.getMonth(),
                  excelDate.getDate()
                ).toISOString();
              }
              
              // Intentar parsear como string en formato DD/MM/YYYY
              if (typeof dateStr === 'string' && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
                  const year = parseInt(parts[2], 10);
                  
                  // Crear fecha y convertir a ISO string
                  return new Date(year, month, day).toISOString();
                }
              }
              
              // Último intento con Date constructor
              try {
                return new Date(dateStr).toISOString();
              } catch (e) {
                logger.error('Error al parsear fecha:', e);
                return null;
              }
            };

            // Buscar IDs de sitios por nombre
            const origenSite = sites.find(site => site.Site === row.origen);
            const destinoSite = sites.find(site => site.Site === row.destino);

            if (!origenSite) {
              throw new Error(`Sitio de origen "${row.origen}" no encontrado en la fila ${index + 2}`);
            }

            if (!destinoSite) {
              throw new Error(`Sitio de destino "${row.destino}" no encontrado en la fila ${index + 2}`);
            }

            // Procesar fechas
            const vigenciaDesde = parseDate(row.vigenciaDesde);
            const vigenciaHasta = parseDate(row.vigenciaHasta);

            if (!vigenciaDesde) {
              throw new Error(`Fecha de vigencia desde inválida en la fila ${index + 2}`);
            }

            if (!vigenciaHasta) {
              throw new Error(`Fecha de vigencia hasta inválida en la fila ${index + 2}`);
            }

            // Verificar si ya tenemos la distancia calculada para este origen-destino
            const distanciaKey = `${origenSite._id}-${destinoSite._id}`;
            const distanciaExistente = distanciasExistentes[distanciaKey];

            return {
              origen: origenSite._id,
              destino: destinoSite._id,
              origenNombre: row.origen,
              destinoNombre: row.destino,
              // Ahora creamos un objeto de tarifa histórica en lugar de incluir estos campos directamente
              tarifaHistorica: {
                tipo: row.tipo || 'TRMC',
                metodoCalculo: row.metodoCalculo || 'Kilometro',
                valor: typeof row.valor === 'number' ? row.valor : parseFloat(row.valor) || 0,
                valorPeaje: typeof row.valorPeaje === 'number' ? row.valorPeaje : parseFloat(row.valorPeaje) || 0,
                vigenciaDesde,
                vigenciaHasta
              },
              // Si existe una distancia calculada previamente, la incluimos
              distanciaPreCalculada: distanciaExistente !== undefined ? distanciaExistente : null
            };
          });

          // Validar datos requeridos
          const invalidData = tramosData.filter(t => 
            !t.origen || 
            !t.destino || 
            !t.tarifaHistorica.tipo || 
            !t.tarifaHistorica.metodoCalculo || 
            !t.tarifaHistorica.vigenciaDesde || 
            !t.tarifaHistorica.vigenciaHasta
          );
          
          if (invalidData.length > 0) {
            throw new Error(`Algunos registros no tienen los campos requeridos. Filas con problemas: ${invalidData.map((_, i) => i + 2).join(', ')}`);
          }

          // Dividir en lotes más pequeños para evitar problemas de tamaño
          const BATCH_SIZE = 20; // Procesar máximo 20 tramos a la vez
          const batches = [];
          for (let i = 0; i < tramosData.length; i += BATCH_SIZE) {
            batches.push(tramosData.slice(i, i + BATCH_SIZE));
          }

          logger.debug(`Enviando ${tramosData.length} tramos en ${batches.length} lotes`);

          let exitosos = 0;
          let errores = [];
          let tramosCreados = 0;
          let tramosActualizados = 0;

          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            setProcessingStatus(`Procesando lote ${i+1} de ${batches.length} (${batch.length} tramos)`);
            setProgress(Math.round((i / batches.length) * 100));
            
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('No hay token de autenticación');
              }

              logger.debug(`Enviando lote ${i+1}:`, {
                tamañoLote: batch.length,
                primerTramo: batch[0],
                distanciasPreCalculadas: batch.filter(t => t.distanciaPreCalculada !== null).length
              });

              const response = await axios.post(
                '/api/tramos/bulk',
                { 
                  cliente, 
                  tramos: batch,
                  reutilizarDistancias: true, // Indicar al backend que queremos reutilizar distancias
                  actualizarExistentes: true  // Nuevo parámetro para indicar que queremos actualizar tramos existentes
                },
                { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 30000 // 30 segundos por lote
                }
              );

              logger.debug(`Respuesta del lote ${i+1}:`, response.data);
              
              if (response.data.success) {
                exitosos += response.data.exitosos || 0;
                tramosCreados += response.data.tramosCreados || 0;
                tramosActualizados += response.data.tramosActualizados || 0;
                if (response.data.errores) {
                  errores = [...errores, ...response.data.errores];
                }
              } else {
                throw new Error(response.data.message || `Error en lote ${i+1}`);
              }
            } catch (batchError) {
              logger.error(`Error en lote ${i+1}:`, batchError);
              
              // Registrar información detallada del error
              if (batchError.response) {
                // Error de respuesta del servidor
                logger.error('Error del servidor:', {
                  status: batchError.response.status,
                  data: batchError.response.data,
                  headers: batchError.response.headers
                });
                errores.push({
                  lote: i+1,
                  error: `Error ${batchError.response.status}: ${batchError.response.data?.message || 'Error del servidor'}`
                });
              } else if (batchError.request) {
                // Error de falta de respuesta
                logger.error('Error de red - no hubo respuesta:', batchError.request);
                errores.push({
                  lote: i+1,
                  error: 'No se recibió respuesta del servidor'
                });
              } else {
                // Error de configuración
                logger.error('Error de configuración:', batchError.message);
                errores.push({
                  lote: i+1,
                  error: `Error de configuración: ${batchError.message}`
                });
              }
            }
          }

          setProgress(100);
          setProcessingStatus('Procesamiento completado');
          
          // Mostrar resultados
          setUploadSuccess(true);
          setUploadResult({
            total: tramosData.length,
            exitosos: exitosos,
            errores: errores,
            tramosCreados: tramosCreados,
            tramosActualizados: tramosActualizados
          });
          
          // Notificar al componente padre para que actualice la lista de tramos
          if (onComplete) {
            onComplete();
          }
        } catch (error) {
          logger.error('Error procesando archivo:', error);
          setUploadError(error.message || 'Error al procesar el archivo');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = (error) => {
        logger.error('Error al leer el archivo:', error);
        setUploadError('Error al leer el archivo');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      logger.error('Error al leer el archivo:', error);
      setUploadError('Error al leer el archivo');
      setLoading(false);
    }
  };

  // Función para manejar la carga del archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel válido (.xlsx o .xls)');
      }
    }
  };

  const processExcelData = async (data) => {
    try {
      setLoading(true);
      
      const parsedData = data.map(row => {
        // Convertir las fechas de Excel a objetos Date
        let vigenciaDesde = row['Vigencia Desde'];
        let vigenciaHasta = row['Vigencia Hasta'];
        
        if (vigenciaDesde) {
          if (typeof vigenciaDesde === 'number') {
            // Si es un número, asumimos que es un número de serie de Excel
            vigenciaDesde = excelDateToJSDate(vigenciaDesde);
          } else if (typeof vigenciaDesde === 'string') {
            // Si es un string, intentamos parsearlo
            vigenciaDesde = new Date(vigenciaDesde);
          }
        } else {
          vigenciaDesde = new Date();
        }
        
        if (vigenciaHasta) {
          if (typeof vigenciaHasta === 'number') {
            vigenciaHasta = excelDateToJSDate(vigenciaHasta);
          } else if (typeof vigenciaHasta === 'string') {
            vigenciaHasta = new Date(vigenciaHasta);
          }
        } else {
          // Por defecto, un año desde la fecha de inicio
          vigenciaHasta = new Date(vigenciaDesde);
          vigenciaHasta.setFullYear(vigenciaHasta.getFullYear() + 1);
        }
        
        return {
          origen: row['Origen'],
          destino: row['Destino'],
          cliente: cliente,
          tarifasHistoricas: [{
            tipo: row['Tipo'] || 'TRMC',
            metodoCalculo: row['Método de Cálculo'] || 'Kilometro',
            valor: parseFloat(row['Valor'] || 0),
            valorPeaje: parseFloat(row['Peaje'] || 0),
            vigenciaDesde: vigenciaDesde.toISOString(),
            vigenciaHasta: vigenciaHasta.toISOString()
          }]
        };
      });
      
      setPreviewData(parsedData);
      setPreviewOpen(true);
    } catch (error) {
      setError(`Error al procesar datos de Excel: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowErrorDetails = (error) => {
    setSelectedError(error);
    setErrorDetailsOpen(true);
  };

  const handleCloseErrorDetails = () => {
    setErrorDetailsOpen(false);
    setSelectedError(null);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Importar Tramos desde Excel - Cliente: {cliente}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Utilice esta herramienta para importar múltiples tramos desde un archivo Excel.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Descargue la plantilla, complete los datos y luego cargue el archivo para importar los tramos.
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Optimización de cálculo de distancias:</Typography>
            <Typography variant="body2">
              El sistema reutilizará automáticamente los cálculos de distancia existentes para los mismos pares origen-destino,
              mejorando el rendimiento de la importación.
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Actualización de tramos existentes:</Typography>
            <Typography variant="body2">
              Si ya existe un tramo con el mismo origen y destino, se agregará la nueva tarifa al tramo existente.
              No se pueden agregar tarifas con fechas superpuestas para el mismo tipo y método de cálculo.
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Manejo de fechas de vigencia:</Typography>
            <Typography variant="body2">
              Para un mismo tramo (mismo origen y destino), puede tener múltiples tarifas con diferentes fechas de vigencia, 
              pero estas fechas no pueden superponerse si son del mismo tipo (TRMC/TRMI) y método de cálculo.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Ejemplo correcto: Tarifa 1 (01/01/2023 - 30/06/2023), Tarifa 2 (01/07/2023 - 31/12/2023)
            </Typography>
            <Typography variant="body2">
              Ejemplo incorrecto: Tarifa 1 (01/01/2023 - 30/06/2023), Tarifa 2 (01/06/2023 - 31/12/2023) ← Superposición en junio
            </Typography>
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudDownloadIcon />}
                onClick={handleDownloadTemplate}
                fullWidth
              >
                Descargar Plantilla Excel
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                component="label"
                fullWidth
                disabled={loading}
              >
                Cargar Archivo Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
          
          {loading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {processingStatus}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
          
          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {uploadResult 
                ? `Se han procesado exitosamente ${uploadResult.exitosos} de ${uploadResult.total} tramos.${
                    uploadResult.tramosCreados ? ` (${uploadResult.tramosCreados} creados, ${uploadResult.tramosActualizados || 0} actualizados)` : ''
                  }`
                : 'Los tramos se han importado exitosamente'}
            </Alert>
          )}
          
          {uploadResult && uploadResult.errores && uploadResult.errores.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" color="error" gutterBottom>
                Errores durante la importación:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell width="10%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Tramo #</TableCell>
                      <TableCell width="80%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Error</TableCell>
                      <TableCell width="10%" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadResult.errores.map((err, index) => (
                      <TableRow key={index}>
                        <TableCell>{err.tramo || err.lote || 'N/A'}</TableCell>
                        <TableCell>
                          {err.error.includes('Conflicto de fechas') ? (
                            <Box>
                              <Typography variant="body2" color="error">
                                {err.error}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                <strong>Solución:</strong> Utilice fechas de vigencia que no se superpongan con las existentes para el mismo tipo de tramo y método de cálculo. Puede usar fechas diferentes o cambiar el tipo de tramo (TRMC/TRMI) o el método de cálculo.
                              </Typography>
                            </Box>
                          ) : (
                            err.error
                          )}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleShowErrorDetails(err)}
                            title="Ver detalles"
                          >
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2">
                <strong>Instrucciones:</strong>
              </Typography>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>Descargue la plantilla Excel y complete los datos de los tramos.</li>
                <li>Los campos marcados con * son obligatorios.</li>
                <li>Utilice los nombres <strong>exactos</strong> de los sitios como aparecen en la hoja "Sitios Disponibles".</li>
                <li>Respete el formato de fecha (DD/MM/YYYY) para las fechas de vigencia.</li>
                <li>Puede usar los ejemplos incluidos en la plantilla como guía.</li>
                <li>No modifique los encabezados de las columnas.</li>
                <li>Una vez completada la plantilla, cárguela para importar los tramos.</li>
              </ul>
            </Alert>
            
            <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
              <Typography variant="body2">
                <strong>Importante:</strong>
              </Typography>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>Si encuentra errores relacionados con fechas, asegúrese de que estén en formato DD/MM/YYYY.</li>
                <li>Verifique que los nombres de los sitios coincidan exactamente con los disponibles.</li>
                <li>El sistema validará que no haya tramos duplicados o con fechas superpuestas.</li>
              </ul>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de detalles de error */}
      <Dialog
        open={errorDetailsOpen}
        onClose={handleCloseErrorDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#f44336', color: 'white', display: 'flex', alignItems: 'center' }}>
          <ErrorIcon sx={{ mr: 1 }} />
          Detalles del Error
        </DialogTitle>
        <DialogContent sx={{ pt: 2, bgcolor: '#333', color: 'white' }}>
          {selectedError && (
            <>
              <Alert severity="error" sx={{ mb: 2, color: '#000' }}>
                <Typography variant="subtitle1">
                  Error en tramo #{selectedError.tramo || selectedError.lote || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  {selectedError.error}
                </Typography>
              </Alert>

              {selectedError.error.includes('Conflicto de fechas') && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom color="white">
                    Explicación del Conflicto
                  </Typography>
                  
                  <Typography variant="body2" paragraph color="white">
                    El sistema ha detectado que está intentando agregar una tarifa con fechas que se superponen 
                    con una tarifa existente para el mismo tramo, tipo y método de cálculo.
                  </Typography>
                  
                  {selectedError.detalles && (
                    <Box sx={{ bgcolor: '#444', p: 2, borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom color="white">
                        Detalles del conflicto:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="white">
                            <strong>Tramo:</strong> {selectedError.detalles.origen} → {selectedError.detalles.destino}
                          </Typography>
                          <Typography variant="body2" color="white">
                            <strong>Tipo:</strong> {selectedError.detalles.tipo}
                          </Typography>
                          <Typography variant="body2" color="white">
                            <strong>Método de cálculo:</strong> {selectedError.detalles.metodoCalculo}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="white">
                            <strong>Vigencia nueva:</strong> {selectedError.detalles.vigenciaDesdeNueva} - {selectedError.detalles.vigenciaHastaNueva}
                          </Typography>
                          <Typography variant="body2" color="white">
                            <strong>Vigencia existente:</strong> {selectedError.detalles.vigenciaDesdeExistente} - {selectedError.detalles.vigenciaHastaExistente}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  <Box sx={{ bgcolor: '#444', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom color="white">
                      Reglas de validación:
                    </Typography>
                    <ul style={{ color: 'white' }}>
                      <li>Para un mismo tramo (mismo origen y destino), puede tener múltiples tarifas con diferentes fechas de vigencia.</li>
                      <li>Las fechas no pueden superponerse si son del mismo tipo (TRMC/TRMI) y método de cálculo.</li>
                      <li>Si cambia el tipo de tramo (TRMC/TRMI) o el método de cálculo, puede tener tarifas con fechas superpuestas.</li>
                    </ul>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom color="white">
                    Posibles Soluciones
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: '#1a237e', color: 'white' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Opción 1: Cambiar las fechas
                        </Typography>
                        <Typography variant="body2">
                          Modifique las fechas de vigencia para que no se superpongan con las existentes.
                          Por ejemplo, si ya existe una tarifa del 01/01/2023 al 30/06/2023, use fechas a partir del 01/07/2023.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: '#1b5e20', color: 'white' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Opción 2: Cambiar el tipo
                        </Typography>
                        <Typography variant="body2">
                          Si está usando TRMC, cambie a TRMI o viceversa. Esto permitirá tener tarifas con fechas superpuestas
                          ya que se consideran tipos diferentes.
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, height: '100%', bgcolor: '#e65100', color: 'white' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Opción 3: Cambiar el método
                        </Typography>
                        <Typography variant="body2">
                          Cambie el método de cálculo (Kilometro, Palet, Fijo). Esto permitirá tener tarifas con fechas superpuestas
                          ya que se consideran métodos diferentes.
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#333' }}>
          <Button onClick={handleCloseErrorDetails} color="primary" variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TramosExcelImporter; 