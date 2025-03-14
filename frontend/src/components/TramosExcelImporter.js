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
  Warning as WarningIcon
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

            return {
              origen: origenSite._id,
              destino: destinoSite._id,
              origenNombre: row.origen,
              destinoNombre: row.destino,
              tipo: row.tipo || 'TRMC',
              metodoCalculo: row.metodoCalculo || 'Kilometro',
              valor: typeof row.valor === 'number' ? row.valor : parseFloat(row.valor) || 0,
              valorPeaje: typeof row.valorPeaje === 'number' ? row.valorPeaje : parseFloat(row.valorPeaje) || 0,
              vigenciaDesde,
              vigenciaHasta
            };
          });

          // Validar datos requeridos
          const invalidData = tramosData.filter(t => !t.origen || !t.destino || !t.tipo || !t.metodoCalculo || !t.vigenciaDesde || !t.vigenciaHasta);
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
                primerTramo: batch[0]
              });

              const response = await axios.post(
                '/api/tramos/bulk',
                { 
                  cliente, 
                  tramos: batch
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
            errores: errores
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

  return (
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
              ? `Se han importado exitosamente ${uploadResult.exitosos} de ${uploadResult.total} tramos.`
              : 'Los tramos se han importado exitosamente'}
          </Alert>
        )}
        
        {uploadResult && uploadResult.errores && uploadResult.errores.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              Errores durante la importación:
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lote</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadResult.errores.map((err, index) => (
                    <TableRow key={index}>
                      <TableCell>{err.lote || 'N/A'}</TableCell>
                      <TableCell>{err.error}</TableCell>
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
  );
};

export default TramosExcelImporter; 