/**
 * @module pages/Vehiculos
 * @description Página principal para la gestión de vehículos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tabs,
  Tab,
  Divider,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import VehiculoList from '../components/vehiculos/VehiculoList';
import VehiculoForm from '../components/vehiculos/VehiculoForm';
import VehiculoBulkImporter from '../components/vehiculos/VehiculoBulkImporter';
import vehiculoService from '../services/vehiculoService';
import useNotification from '../hooks/useNotification';
import Notification from '../components/common/Notification';

// Estado inicial para nuevo vehículo
const initialFormState = {
  dominio: '',
  tipo: 'Camión',
  marca: '',
  modelo: '',
  año: new Date().getFullYear(),
  numeroChasis: '',
  numeroMotor: '',
  empresa: '',
  documentacion: {
    seguro: {
      numero: '',
      vencimiento: null,
      compania: ''
    },
    vtv: {
      numero: '',
      vencimiento: null
    },
    ruta: {
      numero: '',
      vencimiento: null
    },
    senasa: {
      numero: '',
      vencimiento: null
    }
  },
  caracteristicas: {
    capacidadCarga: '',
    tara: '',
    largo: '',
    ancho: '',
    alto: '',
    configuracionEjes: '',
    tipoCarroceria: ''
  },
  activo: true,
  observaciones: ''
};

/**
 * Página principal para la gestión de vehículos
 */
const Vehiculos = () => {
  const { empresaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const empresaNombre = location.state?.empresaNombre || 'Empresa';
  const { notification, success, error, hideNotification } = useNotification();

  // Estados
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [vehiculoToDelete, setVehiculoToDelete] = useState(null);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    ...initialFormState,
    empresa: empresaId
  });

  // Cargar vehículos
  const fetchVehiculos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehiculoService.getVehiculos({ empresa: empresaId });
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.message || 'Error al obtener los vehículos');
    } finally {
      setLoading(false);
    }
  }, [empresaId, error]);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  // Manejadores de formulario
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    // Para campos anidados (documentacion, caracteristicas)
    if (name.includes('.')) {
      const [parent, child, subchild] = name.split('.');
      if (subchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subchild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      // Para campos simples
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleDateChange = (date, docType, field) => {
    setFormData(prev => ({
      ...prev,
      documentacion: {
        ...prev.documentacion,
        [docType]: {
          ...prev.documentacion[docType],
          [field]: date
        }
      }
    }));
  };

  // Operaciones CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vehiculoService.createVehiculo(formData);
      resetForm();
      setOpenDialog(false);
      fetchVehiculos();
      success('Vehículo creado correctamente');
    } catch (err) {
      error(err.message || 'Error al crear vehículo');
    }
  };

  const handleUpdate = async (vehiculo) => {
    try {
      await vehiculoService.updateVehiculo(vehiculo._id, formData);
      resetForm();
      setOpenDialog(false);
      setEditingVehiculo(null);
      fetchVehiculos();
      success('Vehículo actualizado correctamente');
    } catch (err) {
      error(err.message || 'Error al actualizar vehículo');
    }
  };

  const handleDelete = async () => {
    if (!vehiculoToDelete) return;
    
    try {
      await vehiculoService.deleteVehiculo(vehiculoToDelete._id);
      setDeleteDialog(false);
      setVehiculoToDelete(null);
      fetchVehiculos();
      success('Vehículo eliminado correctamente');
    } catch (err) {
      error(err.message || 'Error al eliminar vehículo');
    }
  };

  // Helpers
  const resetForm = () => {
    setFormData({
      ...initialFormState,
      empresa: empresaId
    });
  };

  const openEditDialog = (vehiculo) => {
    setEditingVehiculo(vehiculo);
    setFormData({
      ...vehiculo,
      empresa: empresaId
    });
    setOpenDialog(true);
  };

  const confirmDelete = (vehiculo) => {
    setVehiculoToDelete(vehiculo);
    setDeleteDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box p={3}>
      <Notification 
        open={notification.open} 
        message={notification.message} 
        severity={notification.severity} 
        onClose={hideNotification}
      />

      {/* Migas de pan */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" onClick={() => navigate('/empresas')}>
          Empresas
        </Link>
        <Link color="inherit" onClick={() => navigate(`/empresas/${empresaId}`)}>
          {empresaNombre}
        </Link>
        <Typography color="textPrimary">Vehículos</Typography>
      </Breadcrumbs>

      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/empresas/${empresaId}`)}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5">
            Vehículos de {empresaNombre}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setEditingVehiculo(null);
            setOpenDialog(true);
          }}
        >
          Agregar Vehículo
        </Button>
      </Box>

      {/* Pestañas */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Listado de Vehículos" />
          <Tab label="Importación Masiva" />
        </Tabs>
        <Divider />

        {/* Panel de Listado */}
        {tabValue === 0 && (
          <Box p={2}>
            <VehiculoList
              vehiculos={vehiculos}
              onEdit={openEditDialog}
              onDelete={confirmDelete}
              loading={loading}
            />
          </Box>
        )}

        {/* Panel de Importación */}
        {tabValue === 1 && (
          <Box p={2}>
            <VehiculoBulkImporter 
              empresaId={empresaId} 
              onImportComplete={fetchVehiculos}
            />
          </Box>
        )}
      </Paper>

      {/* Diálogo de Formulario */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </DialogTitle>
        <DialogContent dividers>
          <VehiculoForm
            formData={formData}
            handleChange={handleChange}
            handleDateChange={handleDateChange}
            handleSubmit={handleSubmit}
            handleUpdate={handleUpdate}
            editingVehiculo={editingVehiculo}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el vehículo {vehiculoToDelete?.dominio}?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vehiculos; 