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

const API_URL = process.env.REACT_APP_API_URL;

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchViajes();
      fetchSites();
    }
  }, [isAuthenticated]);

  const fetchViajes = async () => {
    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const response = await axios.get(`${API_URL}/api/viajes`, {
        // headers: { 'Authorization': `Bearer ${token}` } // No necesario con cookies
      });
      setViajes(response.data);
      setError(null);
    } catch (error) {
      logger.error('Error al obtener viajes:', error);
      setError('Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const response = await axios.get(`${API_URL}/api/sites`, {
        // headers: { 'Authorization': `Bearer ${token}` } // No necesario con cookies
      });
      setSites(response.data);
    } catch (error) {
      logger.error('Error al obtener sites:', error);
      setError('Error al cargar los sites');
    }
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
        // const token = localStorage.getItem('token'); // No necesario con cookies
        await axios.delete(`/api/viajes/${id}`); // Headers no necesarios
        fetchViajes(); // Recargar la lista
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
      cliente: '',
      fecha: '',
      origen: '',
      destino: '',
      estado: 'Pendiente',
      observaciones: ''
    });
  };

  const handleSubmit = async () => {
    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      if (selectedViaje) {
        await axios.put(`${API_URL}/api/viajes/${selectedViaje._id}`, formData); // Headers no necesarios
        setSuccessMessage('Viaje actualizado correctamente');
      } else {
        await axios.post(`${API_URL}/api/viajes`, formData); // Headers no necesarios
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
    setSuccessMessage('Importación completada correctamente');
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

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setIsModalOpen(true)}
        >
          Nuevo Viaje
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsImporterOpen(true)}
          startIcon={<CloudUploadIcon />}
        >
          Importar Viajes
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
                <TableCell>{viaje.cliente}</TableCell>
                <TableCell>{new Date(viaje.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{viaje.origen}</TableCell>
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

      {/* Dialog para crear/editar viajes */}
      <Dialog open={isModalOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedViaje ? 'Editar Viaje' : 'Nuevo Viaje'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="cliente"
            label="Cliente"
            type="text"
            fullWidth
            value={formData.cliente}
            onChange={handleInputChange}
            required
          />
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

      {/* Componente de importación masiva */}
      <ViajeBulkImporter
        open={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        cliente={formData.cliente}
        onComplete={handleImportComplete}
        sites={sites}
      />

      {/* Snackbar para mensajes de éxito */}
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
