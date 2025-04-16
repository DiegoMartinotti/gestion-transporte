import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Box, Typography
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import logger from '../utils/logger';
import ViajeBulkImporter from './ViajeBulkImporter';

const API_URL = process.env.REACT_APP_API_URL || '';

const ViajesManager = () => {
  const [viajes, setViajes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedViaje, setSelectedViaje] = useState(null);
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: '',
    origen: '',
    destino: '',
    estado: 'Pendiente',
    observaciones: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [sites, setSites] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [personalList, setPersonalList] = useState([]);
  const [vehiculosList, setVehiculosList] = useState([]);
  const [loadingImporterData, setLoadingImporterData] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClientes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedCliente) {
      fetchViajes();
      fetchSites();
    }
  }, [isAuthenticated, selectedCliente]);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clientes`);
      const clientesData = Array.isArray(response.data) ? response.data : [];
      logger.debug('Clientes recibidos:', clientesData);
      setClientes(clientesData);
      
      if (clientesData && clientesData.length > 0) {
        const primerCliente = clientesData[0]._id || '';
        logger.debug('Seleccionando cliente por defecto:', primerCliente);
        setSelectedCliente(primerCliente);
        setFormData(prev => ({ ...prev, cliente: primerCliente }));
      }
    } catch (error) {
      logger.error('Error al obtener clientes:', error);
      setError('Error al cargar los clientes');
      setClientes([]);
    }
  };

  const fetchViajes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/viajes`, {
        params: { cliente: selectedCliente }
      });
      setViajes(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      logger.error('Error al obtener viajes:', error);
      setError('Error al cargar los viajes');
      setViajes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      logger.debug(`Obteniendo sitios para cliente: ${selectedCliente}`);
      
      const clienteSeleccionado = clientes.find(c => c._id === selectedCliente);
      const nombreCliente = clienteSeleccionado ? clienteSeleccionado.Cliente : '';
      
      logger.debug(`Nombre del cliente: ${nombreCliente}`);
      
      const response = await axios.get(`${API_URL}/api/site`, {
        params: { 
          cliente: nombreCliente
        }
      });
      
      logger.debug('Respuesta de sitios:', response.data);
      
      let sitesData = [];
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          sitesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          sitesData = response.data;
        }
      }
      
      if (sitesData.length === 0) {
        logger.warn('No se encontraron sitios para este cliente, usando fallback');
        
        sitesData = [
          { 
            _id: 'site1', 
            Site: 'CABELMA', 
            Localidad: 'General Pacheco', 
            Provincia: 'Buenos Aires', 
            Direccion: '-',
            coordenadas: {lat: -34.44464, lng: -58.67381}
          },
          { 
            _id: 'site2', 
            Site: 'CATTORINI', 
            Localidad: 'Quilmes', 
            Provincia: 'Buenos Aires', 
            Direccion: '-',
            coordenadas: {lat: -34.75046, lng: -58.33646}
          },
          { 
            _id: 'site3', 
            Site: 'RIGOLLEAU', 
            Localidad: 'Berazategui', 
            Provincia: 'Buenos Aires', 
            Direccion: '-', 
            coordenadas: {lat: -34.7667, lng: -58.20752}
          }
        ];
      }
      
      logger.debug(`Sitios encontrados: ${sitesData.length}`);
      setSites(sitesData);
      
    } catch (error) {
      logger.error('Error al obtener sitios:', error);
      
      const sitiosFallback = [
        { _id: 'site1', Site: 'CABELMA', Localidad: 'General Pacheco', Provincia: 'Buenos Aires', Direccion: '-' },
        { _id: 'site2', Site: 'CATTORINI', Localidad: 'Quilmes', Provincia: 'Buenos Aires', Direccion: '-' },
        { _id: 'site3', Site: 'RIGOLLEAU', Localidad: 'Berazategui', Provincia: 'Buenos Aires', Direccion: '-' }
      ];
      
      setSites(sitiosFallback);
    }
  };

  const fetchPersonalActivo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/personal`, { params: { activo: true } });
      const personalData = response.data?.data || response.data || [];
      logger.debug('Personal activo recibido:', personalData);
      setPersonalList(personalData.map(p => ({...p, legajo: p.numeroLegajo || p.legajo })));
    } catch (error) {
      logger.error('Error al obtener personal activo:', error);
      setError('Error al cargar lista de personal para importación.');
      setPersonalList([]);
    }
  };

  const fetchVehiculos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/vehiculos`);
      const vehiculosData = response.data?.data || response.data || [];
      logger.debug('Vehículos recibidos:', vehiculosData);
      setVehiculosList(vehiculosData.map(v => ({...v, patente: v.dominio || v.patente })));
    } catch (error) {
      logger.error('Error al obtener vehículos:', error);
      setError('Error al cargar lista de vehículos para importación.');
      setVehiculosList([]);
    }
  };

  const handleClienteChange = (event) => {
    setSelectedCliente(event.target.value);
    setFormData(prev => ({ ...prev, cliente: event.target.value }));
  };

  const handleEdit = (id) => {
    const viajeToEdit = viajes.find(v => v._id === id);
    if (viajeToEdit) {
      setSelectedViaje(viajeToEdit);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro que desea eliminar este viaje?')) {
      try {
        await axios.delete(`/api/viajes/${id}`);
        fetchViajes();
        setSuccessMessage('Viaje eliminado correctamente');
      } catch (error) {
        setError('Error al eliminar el viaje: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setSelectedViaje(null);
    setFormData({
      cliente: selectedCliente,
      fecha: '',
      origen: '',
      destino: '',
      estado: 'Pendiente',
      observaciones: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (selectedViaje) {
        await axios.put(`${API_URL}/api/viajes/${selectedViaje._id}`, formData);
        setSuccessMessage('Viaje actualizado correctamente');
      } else {
        await axios.post(`${API_URL}/api/viajes`, formData);
        setSuccessMessage('Viaje creado correctamente');
      }
      handleCloseDialog();
      fetchViajes();
    } catch (error) {
      setError('Error al guardar el viaje: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImportComplete = () => {
    fetchViajes();
    setSuccessMessage('Importación procesada. Revisa los resultados.');
    setIsImporterOpen(false);
  };

  const handleOpenImporter = async () => {
    if (!selectedCliente) {
        setError('Por favor, seleccione un cliente primero.');
        return;
    }
    setLoadingImporterData(true);
    setError(null);
    try {
        await Promise.all([fetchPersonalActivo(), fetchVehiculos()]);
        setIsImporterOpen(true);
    } catch (error) {
        logger.error('Error al cargar datos para el importador', error)
    } finally {
        setLoadingImporterData(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestión de Viajes
        </Typography>

        <Button
          variant="outlined"
          onClick={() => window.history.back()}
          sx={{ width: 'auto' }}
        >
          Volver Atrás
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="cliente-select-label">Seleccionar Cliente</InputLabel>
          <Select
            labelId="cliente-select-label"
            value={selectedCliente}
            onChange={handleClienteChange}
            label="Seleccionar Cliente"
            disabled={loading || clientes.length === 0}
          >
            {clientes.map((cliente) => (
              <MenuItem key={cliente._id} value={cliente._id}>
                {cliente.Cliente}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedCliente}
        >
          Nuevo Viaje
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenImporter}
          startIcon={loadingImporterData ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          disabled={!selectedCliente || loadingImporterData}
        >
          {loadingImporterData ? 'Cargando Datos...' : 'Importar Viajes'}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {viajes.map((viaje) => (
              <TableRow key={viaje._id}>
                <TableCell>{viaje.cliente?.Cliente}</TableCell> {/* Mostrar nombre del cliente */}
                <TableCell>{new Date(viaje.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{viaje.origen}</TableCell> {/* TODO: Poblar origen/destino si son IDs */}
                <TableCell>{viaje.destino}</TableCell>
                <TableCell>{viaje.estado}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(viaje._id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(viaje._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedViaje ? 'Editar Viaje' : 'Nuevo Viaje'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Cliente</InputLabel>
            <Select
              name="cliente"
              value={formData.cliente}
              onChange={handleInputChange}
              required
            >
              {clientes.map((cliente) => (
                <MenuItem key={cliente._id} value={cliente._id}>
                  {cliente.Cliente}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="fecha"
            label="Fecha"
            type="date"
            fullWidth
            value={formData.fecha}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            margin="dense"
            name="origen"
            label="Origen"
            type="text"
            fullWidth
            value={formData.origen}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="destino"
            label="Destino"
            type="text"
            fullWidth
            value={formData.destino}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Estado</InputLabel>
            <Select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="Cancelado">Cancelado</MenuItem>
              <MenuItem value="Completado">Completado</MenuItem>
              <MenuItem value="En Proceso">En Proceso</MenuItem>
              <MenuItem value="Pendiente">Pendiente</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="observaciones"
            label="Observaciones"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={formData.observaciones}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedViaje ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {isImporterOpen && (
          <ViajeBulkImporter
            open={isImporterOpen}
            onClose={() => setIsImporterOpen(false)}
            cliente={selectedCliente}
            onComplete={handleImportComplete}
            sites={sites}
            personal={personalList}
            vehiculos={vehiculosList}
          />
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ViajesManager;
