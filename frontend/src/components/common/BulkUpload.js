/**
 * @module components/common/BulkUpload
 * @description Componente reutilizable para cargas masivas de datos mediante pegar desde Excel
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Button, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import logger from '../../utils/logger';

/**
 * Componente para realizar cargas masivas mediante copiar y pegar desde Excel
 * 
 * @component
 * @example
 * const columns = [
 *   { key: 'origen', label: 'Origen', required: true },
 *   { key: 'destino', label: 'Destino', required: true }
 * ];
 * 
 * <BulkUpload
 *   columns={columns}
 *   onProcessData={(data) => transformData(data)}
 *   onUpload={(processedData) => uploadToServer(processedData)}
 *   onUploadComplete={(result) => handleResult(result)}
 *   buttonText="Importar desde Excel"
 * />
 */
const BulkUpload = ({ 
  columns,
  onProcessData,
  onUpload,
  onUploadComplete,
  buttonText = "Cargar datos masivamente",
  dialogTitle = "Pegar datos desde Excel (Ctrl+V)",
  apiUrl,
  apiEndpoint
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tableData, setTableData] = useState([Array(columns.length).fill('')]);
  const [successMessage, setSuccessMessage] = useState(null);

  // Extraer solo las claves de las columnas para simplificar
  const columnKeys = columns.map(col => col.key);

  /**
   * Maneja el evento de pegar datos desde el portapapeles
   */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split('\n').filter(row => row.trim());
    
    try {
      const processedRows = rows.map(row => {
        const cells = row.split('\t');
        return columnKeys.map((_, index) => cells[index] || '');
      });

      setTableData(processedRows);
      setError(null);
      logger.debug(`Datos pegados: ${processedRows.length} filas`);
    } catch (err) {
      logger.error('Error al procesar los datos pegados:', err);
      setError('Error al procesar los datos. Asegúrese de copiar desde Excel.');
    }
  }, [columnKeys]);

  /**
   * Procesa los datos de la tabla para prepararlos para la carga
   */
  const processTableData = (data) => {
    if (onProcessData) {
      return onProcessData(data, columns);
    }

    // Procesamiento predeterminado si no se proporciona uno personalizado
    return data.map((row, rowIndex) => {
      const item = {};
      
      columns.forEach((column, colIndex) => {
        const value = row[colIndex]?.trim();
        
        // Validar campos requeridos
        if (column.required && !value) {
          throw new Error(`Fila ${rowIndex + 1}: El campo ${column.label || column.key} es requerido`);
        }

        // Asignar valor según el tipo
        if (column.type === 'number') {
          const numValue = Number(value);
          if (value && isNaN(numValue)) {
            throw new Error(`Fila ${rowIndex + 1}: ${column.label || column.key} debe ser un número`);
          }
          item[column.key] = numValue || 0;
        } else if (column.type === 'boolean') {
          item[column.key] = value?.toLowerCase() === 'true' || value?.toLowerCase() === 'si' || value?.toLowerCase() === 'sí';
        } else if (column.type === 'date') {
          if (value) {
            const [day, month, year] = value.split('/');
            if (!day || !month || !year) {
              throw new Error(`Fila ${rowIndex + 1}: Formato de fecha inválido. Use DD/MM/YYYY`);
            }
            item[column.key] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
          }
        } else {
          item[column.key] = value;
        }
      });

      return item;
    });
  };

  /**
   * Maneja el guardado de los datos
   */
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (tableData.length === 0 || tableData[0].every(cell => !cell)) {
        throw new Error('No hay datos para procesar');
      }

      // Procesar los datos
      const processedData = processTableData(tableData);
      
      let result;
      
      // Si se proporciona una función de carga personalizada, usarla
      if (onUpload) {
        result = await onUpload(processedData);
      } 
      // De lo contrario, usar la URL y endpoint predeterminados
      else if (apiUrl && apiEndpoint) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/${apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: processedData })
        });

        result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Error al cargar los datos');
        }
      } else {
        throw new Error('No se ha proporcionado un método para enviar los datos');
      }

      // Manejar errores en la respuesta
      if (result.errores?.length > 0) {
        setError(`Se encontraron ${result.errores.length} errores. ${result.exitosos || 0} registros guardados correctamente.`);
      } else {
        setSuccessMessage(`${result.exitosos || processedData.length} registros guardados correctamente.`);
        
        // Limpiar la tabla después de una carga exitosa
        setTimeout(() => {
          setOpenDialog(false);
          setTableData([Array(columns.length).fill('')]);
          onUploadComplete && onUploadComplete(result);
        }, 1500);
      }
    } catch (err) {
      logger.error('Error al procesar/guardar datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        variant="contained" 
        onClick={() => setOpenDialog(true)}
        startIcon={<CloudUploadIcon />}
      >
        {buttonText}
      </Button>

      <Dialog 
        open={openDialog} 
        onClose={() => !loading && setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary">
              Copie los datos desde Excel y péguelos en la tabla a continuación:
            </Typography>
          </Box>
          
          <TableContainer 
            component={Paper} 
            onPaste={handlePaste} 
            tabIndex="0"
            style={{ 
              minHeight: '200px', 
              border: '2px dashed #ccc', 
              cursor: 'text',
              padding: '8px'
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.label || column.key}
                      {column.required && <Chip size="small" label="Requerido" color="primary" variant="outlined" style={{marginLeft: 4}} />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {error && <Alert severity="error" style={{ marginTop: 10 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" style={{ marginTop: 10 }}>{successMessage}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={loading || tableData.length === 0 || tableData[0].every(cell => !cell)}
          >
            {loading ? <CircularProgress size={24} /> : 'Cargar datos'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

BulkUpload.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      required: PropTypes.bool,
      type: PropTypes.oneOf(['string', 'number', 'boolean', 'date'])
    })
  ).isRequired,
  onProcessData: PropTypes.func,
  onUpload: PropTypes.func,
  onUploadComplete: PropTypes.func,
  buttonText: PropTypes.string,
  dialogTitle: PropTypes.string,
  apiUrl: PropTypes.string,
  apiEndpoint: PropTypes.string
};

export default BulkUpload; 