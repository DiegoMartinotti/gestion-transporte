import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Typography,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  DirectionsCar as VehiculoIcon, 
  Person as PersonalIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable';
import empresaService from '../../services/empresaService';
import useNotification from '../../hooks/useNotification';

/**
 * Componente para listar y gestionar empresas
 * @component
 */
const EmpresaList = ({ onAddEmpresa, onEditEmpresa, onDeleteEmpresa }) => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmpresas();
  }, []);

  // Obtener listado de empresas
  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      console.log('Solicitando empresas...');
      const data = await empresaService.getAllEmpresas();
      console.log('Respuesta de empresas recibida:', data);
      
      // Las empresas vienen directamente como array desde el backend
      if (Array.isArray(data)) {
        console.log(`Se encontraron ${data.length} empresas`);
        setEmpresas(data);
      } else {
        console.error('Formato de respuesta inesperado:', data);
        setEmpresas([]);
        showNotification('Error en el formato de datos recibidos', 'error');
      }
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      setEmpresas([]);
      showNotification('Error al cargar empresas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar empresa
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) {
      try {
        await empresaService.deleteEmpresa(id);
        showNotification('Empresa eliminada correctamente', 'success');
        fetchEmpresas();
        
        if (onDeleteEmpresa) {
          onDeleteEmpresa(id);
        }
      } catch (error) {
        console.error('Error al eliminar empresa:', error);
        showNotification('Error al eliminar empresa', 'error');
      }
    }
  };

  // Navegar a gestión de vehículos
  const handleGestionarVehiculos = (empresaId, empresaNombre) => {
    navigate(`/vehiculos/${empresaId}`, { state: { empresaNombre } });
  };

  // Navegar a gestión de personal
  const handleGestionarPersonal = (empresaId, empresaNombre) => {
    navigate(`/personal/${empresaId}`, { state: { empresaNombre } });
  };

  // Definición de columnas para la tabla
  const columns = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'razonSocial', headerName: 'Razón Social', flex: 1.5 },
    { field: 'cuit', headerName: 'CUIT', flex: 0.8 },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.8 },
    { field: 'tipo', headerName: 'Tipo', flex: 0.5, 
      renderCell: (params) => (
        params.row.esTransportista ? 'Transportista' : 'Cliente'
      )
    },
    { field: 'actions', headerName: 'Acciones', flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="Editar empresa">
            <IconButton 
              size="small" 
              onClick={() => onEditEmpresa(params.row)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar empresa">
            <IconButton 
              size="small" 
              onClick={() => handleDelete(params.row._id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestionar vehículos">
            <IconButton 
              size="small" 
              onClick={() => handleGestionarVehiculos(params.row._id, params.row.nombre)}
              color="secondary"
            >
              <VehiculoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gestionar personal">
            <IconButton 
              size="small" 
              onClick={() => handleGestionarPersonal(params.row._id, params.row.nombre)}
              color="info"
            >
              <PersonalIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', m: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Listado de Empresas</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddEmpresa}
        >
          Nueva Empresa
        </Button>
      </Box>
      
      <DataTable 
        rows={empresas}
        columns={columns}
        getRowId={(row) => row._id}
        onRefresh={fetchEmpresas}
      />
    </Paper>
  );
};

EmpresaList.propTypes = {
  onAddEmpresa: PropTypes.func.isRequired,
  onEditEmpresa: PropTypes.func.isRequired,
  onDeleteEmpresa: PropTypes.func
};

export default EmpresaList; 