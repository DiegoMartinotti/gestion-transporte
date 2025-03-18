import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Grid, IconButton, 
  Tooltip, CircularProgress, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import tramoService from '../../services/tramoService';
import DataTable from '../common/DataTable';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';

const TramoList = ({ cliente, onEdit, onAdd }) => {
  const [tramos, setTramos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const { showNotification } = useNotification();
  
  const fetchTramos = async () => {
    if (!cliente) return;
    
    try {
      setLoading(true);
      const response = await tramoService.getTramos(cliente);
      setTramos(response.data);
    } catch (error) {
      console.error('Error al cargar tramos:', error);
      showNotification('Error al cargar los tramos', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTramos();
  }, [cliente]);
  
  const handleDeleteTramo = async (id) => {
    if (!window.confirm('¿Está seguro que desea eliminar este tramo?')) return;
    
    try {
      await tramoService.deleteTramo(id);
      showNotification('Tramo eliminado correctamente', 'success');
      fetchTramos();
    } catch (error) {
      console.error('Error al eliminar tramo:', error);
      showNotification('Error al eliminar el tramo', 'error');
    }
  };
  
  const columns = [
    { 
      id: 'origen', 
      label: 'Origen', 
      minWidth: 170,
      format: (value, row) => row.origenNombre || value
    },
    { 
      id: 'destino', 
      label: 'Destino', 
      minWidth: 170,
      format: (value, row) => row.destinoNombre || value
    },
    { 
      id: 'tipo', 
      label: 'Tipo', 
      minWidth: 80,
      format: (value, row) => {
        const tipo = row.tarifaHistorica?.tipo || value;
        return tipo === 'TRMC' ? 'Completa' : 'Intermedia';
      }
    },
    { 
      id: 'metodoCalculo', 
      label: 'Método', 
      minWidth: 120,
      format: (value, row) => row.tarifaHistorica?.metodoCalculo || value
    },
    { 
      id: 'valor', 
      label: 'Tarifa Base', 
      minWidth: 120,
      format: (value, row) => formatCurrency(row.tarifaHistorica?.valor || value)
    },
    { 
      id: 'valorPeaje', 
      label: 'Peaje', 
      minWidth: 100,
      format: (value, row) => formatCurrency(row.tarifaHistorica?.valorPeaje || value)
    },
    { 
      id: 'distancia', 
      label: 'Distancia', 
      minWidth: 100,
      format: (value) => value ? `${value.toFixed(2)} km` : 'N/A'
    },
    { 
      id: 'vigenciaDesde', 
      label: 'Desde', 
      minWidth: 100,
      format: (value, row) => formatDate(row.tarifaHistorica?.vigenciaDesde || value)
    },
    { 
      id: 'vigenciaHasta', 
      label: 'Hasta', 
      minWidth: 100,
      format: (value, row) => formatDate(row.tarifaHistorica?.vigenciaHasta || value)
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 100,
      align: 'center',
      format: (_, row) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => onEdit(row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => handleDeleteTramo(row._id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];
  
  const tramosFiltrados = tramos.filter(tramo => {
    if (tipoFiltro === 'TODOS') return true;
    return (tramo.tarifaHistorica?.tipo || tramo.tipo) === tipoFiltro;
  });
  
  return (
    <Box>
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">
            Tramos {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="tipo-filtro-label">Tipo</InputLabel>
            <Select
              labelId="tipo-filtro-label"
              id="tipo-filtro"
              value={tipoFiltro}
              label="Tipo"
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="TRMC">Completa</MenuItem>
              <MenuItem value="TRMI">Intermedia</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4} container justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ mr: 1 }}
          >
            Nuevo Tramo
          </Button>
          <Tooltip title="Actualizar">
            <IconButton onClick={fetchTramos} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      
      <DataTable
        columns={columns}
        rows={tramosFiltrados}
        loading={loading}
        getRowId={(row) => row._id}
        emptyMessage="No hay tramos para mostrar"
      />
    </Box>
  );
};

export default TramoList; 