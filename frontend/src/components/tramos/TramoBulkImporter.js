import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Grid, Typography, LinearProgress, 
  Box, Alert, Tabs, Tab, FormControlLabel, Switch
} from '@mui/material';
import BulkUpload from '../common/BulkUpload';
import tramoService from '../../services/tramoService';
import useNotification from '../../hooks/useNotification';

// Panel para cada pestaña
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TramoBulkImporter = ({ open, onClose, cliente, onComplete, sites = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [reutilizarDistancias, setReutilizarDistancias] = useState(true);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const { showNotification } = useNotification();
  
  const [distanciasExistentes, setDistanciasExistentes] = useState({});
  
  // Mapa para búsquedas rápidas de sitios por nombre
  const sitesMap = {};
  sites.forEach(site => {
    sitesMap[site.nombre.toLowerCase()] = site;
  });
  
  // Columnas requeridas para la importación
  const requiredColumns = ['origen', 'destino', 'tipo', 'valor'];
  const columnsDescription = [
    { id: 'origen', name: 'Origen', description: 'Nombre del sitio de origen' },
    { id: 'destino', name: 'Destino', description: 'Nombre del sitio de destino' },
    { id: 'tipo', name: 'Tipo', description: 'Tipo de tramo (TRMC o TRMI)' },
    { id: 'metodoCalculo', name: 'Método Cálculo', description: 'Método de cálculo (Kilometro, Fijo, Hora)' },
    { id: 'valor', name: 'Valor', description: 'Valor base del tramo' },
    { id: 'valorPeaje', name: 'Valor Peaje', description: 'Valor del peaje (opcional)' },
    { id: 'vigenciaDesde', name: 'Vigencia Desde', description: 'Fecha de inicio de vigencia (YYYY-MM-DD)' },
    { id: 'vigenciaHasta', name: 'Vigencia Hasta', description: 'Fecha de fin de vigencia (YYYY-MM-DD)' }
  ];

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const resetState = () => {
    setRows([]);
    setError(null);
    setImporting(false);
    setProgress(0);
    setProcessingStatus('');
  };

  useEffect(() => {
    // Al abrir, resetear el estado
    if (open) {
      resetState();
    }
  }, [open]);

  // Validar los datos antes de procesarlos
  const validateData = (data) => {
    if (!data || data.length === 0) {
      return { valid: false, message: 'No hay datos para importar' };
    }

    // Verificar columnas requeridas
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
    
    if (missingColumns.length > 0) {
      return { 
        valid: false, 
        message: `Faltan columnas requeridas: ${missingColumns.join(', ')}` 
      };
    }

    // Verificar sitios existentes
    const sitesErrors = [];
    data.forEach((row, index) => {
      if (!row.origen || !sitesMap[row.origen.toLowerCase()]) {
        sitesErrors.push(`Fila ${index + 1}: Sitio de origen "${row.origen}" no encontrado`);
      }
      if (!row.destino || !sitesMap[row.destino.toLowerCase()]) {
        sitesErrors.push(`Fila ${index + 1}: Sitio de destino "${row.destino}" no encontrado`);
      }
    });

    if (sitesErrors.length > 0) {
      const message = sitesErrors.length > 3 
        ? `${sitesErrors.slice(0, 3).join('\n')} y ${sitesErrors.length - 3} errores más...`
        : sitesErrors.join('\n');
      
      return { valid: false, message };
    }

    return { valid: true };
  };

  // Procesar y preparar los datos para enviar al servidor
  const processData = (data) => {
    // Añadir valores por defecto y conversiones
    return data.map(row => {
      const origenSite = sitesMap[row.origen.toLowerCase()];
      const destinoSite = sitesMap[row.destino.toLowerCase()];
      
      // Formatear fechas de vigencia
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      
      const vigenciaDesde = row.vigenciaDesde 
        ? new Date(row.vigenciaDesde) 
        : today;
        
      const vigenciaHasta = row.vigenciaHasta 
        ? new Date(row.vigenciaHasta) 
        : nextYear;
      
      // Verificar si ya tenemos la distancia calculada para este origen-destino
      const distanciaKey = `${origenSite._id}-${destinoSite._id}`;
      const distanciaExistente = distanciasExistentes[distanciaKey];
      
      return {
        origen: origenSite._id,
        destino: destinoSite._id,
        origenNombre: origenSite.nombre,
        destinoNombre: destinoSite.nombre,
        tarifaHistorica: {
          tipo: row.tipo || 'TRMC',
          metodoCalculo: row.metodoCalculo || 'Kilometro',
          valor: parseFloat(row.valor) || 0,
          valorPeaje: parseFloat(row.valorPeaje || 0),
          vigenciaDesde: vigenciaDesde.toISOString(),
          vigenciaHasta: vigenciaHasta.toISOString()
        },
        // Si existe una distancia pre-calculada, la incluimos
        distanciaPreCalculada: distanciaExistente !== undefined ? distanciaExistente : null
      };
    });
  };

  const handleDataLoaded = (data, source) => {
    setRows(data);
    
    // Validar los datos
    const validation = validateData(data);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    
    setError(null);
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      setError('No hay datos para importar');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setImporting(true);
      setProgress(0);
      
      // Procesar datos para el formato correcto
      const processedData = processData(rows);
      
      // Dividir en lotes más pequeños para evitar problemas de tamaño
      const BATCH_SIZE = 20; // Procesar máximo 20 tramos a la vez
      const batches = [];
      
      for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
        batches.push(processedData.slice(i, i + BATCH_SIZE));
      }
      
      let exitosos = 0;
      let errores = [];
      let tramosCreados = 0;
      let tramosActualizados = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setProcessingStatus(`Procesando lote ${i+1} de ${batches.length} (${batch.length} tramos)`);
        setProgress(Math.round((i / batches.length) * 100));
        
        try {
          const response = await tramoService.bulkImportTramos(
            cliente, 
            batch, 
            reutilizarDistancias, 
            actualizarExistentes
          );
          
          exitosos += response.data.exitosos || 0;
          tramosCreados += response.data.tramosCreados || 0;
          tramosActualizados += response.data.tramosActualizados || 0;
          
          if (response.data.errores && response.data.errores.length > 0) {
            errores = [...errores, ...response.data.errores];
          }
        } catch (error) {
          console.error(`Error procesando lote ${i+1}:`, error);
          errores.push({
            lote: i+1,
            mensaje: error.response?.data?.message || error.message
          });
        }
      }
      
      setProgress(100);
      setProcessingStatus('¡Importación completada!');
      
      const resultMessage = `
        Proceso completado:
        - Total: ${processedData.length} tramos
        - Exitosos: ${exitosos} tramos
        - Errores: ${errores.length} tramos
        - Creados: ${tramosCreados} tramos
        - Actualizados: ${tramosActualizados} tramos
      `;
      
      if (errores.length > 0) {
        showNotification(
          `Importación completada con ${errores.length} errores. Revise la consola para más detalles.`, 
          'warning'
        );
        console.warn('Errores en la importación:', errores);
      } else {
        showNotification('Importación completada exitosamente', 'success');
      }
      
      if (onComplete) {
        onComplete({
          total: processedData.length,
          exitosos,
          errores,
          tramosCreados,
          tramosActualizados
        });
      }
      
      // Esperar un momento antes de cerrar para mostrar el 100%
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error general en la importación:', error);
      setError(`Error en la importación: ${error.message}`);
      showNotification(`Error en la importación: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={!importing ? onClose : undefined} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { 
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        } 
      }}
    >
      <DialogTitle>Importación Masiva de Tramos</DialogTitle>
      <DialogContent dividers>
        {!cliente ? (
          <Alert severity="warning">
            Debe seleccionar un cliente antes de importar tramos.
          </Alert>
        ) : (
          <>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Importar desde CSV" />
              <Tab label="Importar desde Excel" />
            </Tabs>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {importing ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  {processingStatus}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body2" color="textSecondary" align="right">
                  {`${Math.round(progress)}%`}
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={reutilizarDistancias}
                          onChange={(e) => setReutilizarDistancias(e.target.checked)}
                        />
                      }
                      label="Reutilizar distancias pre-calculadas"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={actualizarExistentes}
                          onChange={(e) => setActualizarExistentes(e.target.checked)}
                        />
                      }
                      label="Actualizar tramos existentes"
                    />
                  </Grid>
                </Grid>
                
                <TabPanel value={tabValue} index={0}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instrucciones para CSV:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Suba un archivo CSV con las siguientes columnas:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {columnsDescription.map((col) => (
                      <Typography component="li" variant="body2" key={col.id}>
                        <strong>{col.name}</strong> - {col.description}
                      </Typography>
                    ))}
                  </Box>
                  
                  <BulkUpload
                    onDataLoaded={(data) => handleDataLoaded(data, 'csv')}
                    accept=".csv"
                    type="csv"
                    requiredColumns={requiredColumns}
                  />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instrucciones para Excel:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Suba un archivo Excel con las siguientes columnas:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {columnsDescription.map((col) => (
                      <Typography component="li" variant="body2" key={col.id}>
                        <strong>{col.name}</strong> - {col.description}
                      </Typography>
                    ))}
                  </Box>
                  
                  <BulkUpload
                    onDataLoaded={(data) => handleDataLoaded(data, 'excel')}
                    accept=".xlsx, .xls"
                    type="excel"
                    requiredColumns={requiredColumns}
                  />
                </TabPanel>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={importing}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleImport} 
          color="primary" 
          variant="contained"
          disabled={importing || loading || !rows.length || !!error}
        >
          Importar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TramoBulkImporter; 