import React, { useState, useCallback } from 'react';
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
  Paper
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

const COLUMNS = ['origen', 'destino', 'fecha', 'tarifa', 'cliente', 'dt', 'demoras', 'operativos', 'estadias', 'cobrado', 'paletas'];

const BulkUpload = ({ onUploadComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tableData, setTableData] = useState([Array(COLUMNS.length).fill('')]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split('\n').filter(row => row.trim());
    
    const processedRows = rows.map(row => {
      const cells = row.split('\t');
      return COLUMNS.map((_, index) => cells[index] || '');
    });

    setTableData(processedRows);
  }, []);

  const processTableData = (data) => {
    return data.map((row, index) => {
      const viaje = {
        extras: {
          demoras: 0,
          operativos: 0,
          estadias: 0
        }
      };
      
      COLUMNS.forEach((column, colIndex) => {
        const value = row[colIndex]?.trim();
        
        if (!value && ['origen', 'destino', 'fecha', 'tarifa', 'cliente', 'dt'].includes(column)) {
          throw new Error(`Fila ${index + 1}: El campo ${column} es requerido`);
        }

        switch(column) {
          case 'fecha':
            if (value) {
              const [day, month, year] = value.split('/');
              if (!day || !month || !year) {
                throw new Error(`Fila ${index + 1}: Formato de fecha inválido. Use DD/MM/YYYY`);
              }
              viaje[column] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
            }
            break;
          case 'dt':
            viaje[column] = value;
            break;
          case 'tarifa':
            const tarifaNum = Number(value);
            if (isNaN(tarifaNum)) {
              throw new Error(`Fila ${index + 1}: Tarifa debe ser un número`);
            }
            viaje[column] = tarifaNum;
            break;
          case 'demoras':
            viaje.extras.demoras = Number(value) || 0;
            break;
          case 'operativos':
            viaje.extras.operativos = Number(value) || 0;
            break;
          case 'estadias':
            viaje.extras.estadias = Number(value) || 0;
            break;
          case 'paletas':
            viaje[column] = Number(value) || 0;
            break;
          case 'cobrado':
            viaje[column] = value?.toLowerCase() === 'true';
            break;
          default:
            viaje[column] = value;
        }
      });

      return viaje;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      if (tableData.length === 0 || tableData[0].every(cell => !cell)) {
        throw new Error('No hay datos para procesar');
      }

      const processedData = processTableData(tableData);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/viajes/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ viajes: processedData })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar los viajes');
      }

      if (result.errores?.length > 0) {
        setError(`Se encontraron ${result.errores.length} errores. ${result.exitosos} viajes guardados correctamente.`);
      } else {
        onUploadComplete && onUploadComplete(result);
        setOpenDialog(false);
        setTableData([Array(COLUMNS.length).fill('')]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <Button 
        variant="contained" 
        onClick={() => setOpenDialog(true)}
      >
        Pegar datos en tabla
      </Button>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Pegar datos desde Excel (Ctrl+V)</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} onPaste={handlePaste} tabIndex="0">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={loading || tableData.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Cargar datos'}
          </Button>
        </DialogActions>
      </Dialog>
      {error && <Alert severity="error">{error}</Alert>}
    </div>
  );
};

export default BulkUpload;
