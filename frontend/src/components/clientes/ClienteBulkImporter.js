import React, { useState } from 'react';
import { 
  Box, Typography, Button, Paper, 
  CircularProgress, Alert, Grid 
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import BulkUpload from '../common/BulkUpload';
import clienteService from '../../services/clienteService';
import useNotification from '../../hooks/useNotification';
import logger from '../../utils/logger';

/**
 * Componente para importación masiva de clientes desde Excel
 * @param {Object} props
 * @param {Function} props.onImportComplete - Función a ejecutar al completar importación
 */
const ClienteBulkImporter = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  /**
   * Procesa el archivo Excel subido
   * @param {File} file - Archivo Excel
   */
  const handleFileUpload = (file) => {
    setError(null);
    setPreviewData([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length === 0) {
          setError('El archivo está vacío');
          return;
        }
        
        // Validar estructura mínima requerida
        if (!json[0].hasOwnProperty('Cliente') || !json[0].hasOwnProperty('CUIT')) {
          setError('El archivo no tiene el formato correcto. Se requieren columnas: Cliente, CUIT');
          return;
        }
        
        setPreviewData(json);
      } catch (error) {
        logger.error('Error procesando archivo Excel:', error);
        setError('Error al procesar el archivo. Verifique que sea un archivo Excel válido.');
      }
    };
    
    reader.onerror = () => {
      setError('Error al leer el archivo');
    };
    
    reader.readAsArrayBuffer(file);
  };

  /**
   * Importa los datos a la base de datos
   */
  const handleImport = async () => {
    if (previewData.length === 0) {
      setError('No hay datos para importar');
      return;
    }
    
    try {
      setLoading(true);
      
      // Proceso de importación cliente por cliente
      const results = [];
      for (const cliente of previewData) {
        try {
          // Normalizar datos
          const clienteData = {
            Cliente: cliente.Cliente,
            CUIT: cliente.CUIT?.toString() || '',
            formulaPaletSider: cliente.formulaPaletSider || 'Valor * Palets + Peaje',
            formulaPaletBitren: cliente.formulaPaletBitren || 'Valor * Palets + Peaje'
          };
          
          await clienteService.createCliente(clienteData);
          results.push({ 
            success: true, 
            cliente: clienteData.Cliente 
          });
        } catch (error) {
          results.push({ 
            success: false, 
            cliente: cliente.Cliente, 
            error: error.message || 'Error desconocido' 
          });
        }
      }
      
      // Resultados
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;
      
      showNotification(
        `Importación completada: ${successCount} clientes importados, ${errorCount} errores`,
        errorCount > 0 ? 'warning' : 'success'
      );
      
      // Limpiar estados
      setPreviewData([]);
      
      // Notificar al componente padre
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      logger.error('Error en importación masiva:', error);
      setError('Error al realizar la importación');
      showNotification('Error al realizar la importación', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Importación Masiva de Clientes
        </Typography>
        
        <BulkUpload 
          onFileUpload={handleFileUpload}
          acceptedFileTypes={'.xlsx, .xls'}
          maxFileSizeMB={5}
        />
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {previewData.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vista previa ({previewData.length} clientes)
            </Typography>
            
            <Paper sx={{ maxHeight: 300, overflow: 'auto', mt: 2, mb: 2 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Cliente</th>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>CUIT</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.Cliente}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.CUIT}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Paper>
            
            <Grid container justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? 'Importando...' : 'Importar Clientes'}
              </Button>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClienteBulkImporter; 