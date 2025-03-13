import React, { useState, useEffect } from 'react';
import {
  Box, Button, TextField, Dialog, DialogActions, DialogContent,
  DialogTitle, Typography, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Snackbar, Alert, IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { DATE_FORMAT, formatISODate } from '../utils/dateUtils';
import logger from '../utils/logger';

dayjs.locale('es');

const API_URL = process.env.REACT_APP_API_URL;

const initialFormData = {
  tipo: '',
  cliente: '',
  vigenciaDesde: dayjs(),
  vigenciaHasta: dayjs().add(1, 'year'),
  valor: 0
};

const ExtrasManager = ({ cliente, onBack }) => {
  const [extras, setExtras] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchExtras();
  }, [cliente]);

  const fetchExtras = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/extras?cliente=${cliente}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al obtener extras');
      const data = await response.json();
      setExtras(data);
    } catch (error) {
      setErrorMessage('Error al cargar los extras: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (extra = null) => {
    if (extra) {
      setFormData({
        ...extra,
        vigenciaDesde: dayjs(extra.vigenciaDesde),
        vigenciaHasta: dayjs(extra.vigenciaHasta)
      });
      setSelectedExtra(extra);
    } else {
      const { tipo, cliente, vigenciaDesde, vigenciaHasta, valor } = initialFormData;
      setFormData({
        tipo,
        cliente,
        vigenciaDesde,
        vigenciaHasta,
        valor,
        cliente: cliente
      });
      setSelectedExtra(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setSelectedExtra(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'descripcion' && !value.trim()) {
      const { descripcion, ...rest } = formData;
      setFormData(rest);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = selectedExtra 
        ? `${API_URL}/api/extras/${selectedExtra._id}`
        : `${API_URL}/api/extras`;
      
      // Validar que el valor sea un número
      const valorNumerico = parseFloat(formData.valor);
      if (isNaN(valorNumerico)) {
        throw new Error('El valor debe ser un número válido');
      }

      // Asegurar que las fechas sean válidas
      if (!formData.vigenciaDesde || !formData.vigenciaHasta) {
        throw new Error('Las fechas de vigencia son obligatorias');
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (formData.vigenciaHasta.isBefore(formData.vigenciaDesde)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Preparar los datos para enviar
      const dataToSend = {
        tipo: formData.tipo.trim().toUpperCase(),
        cliente: cliente.trim().toUpperCase(),
        valor: valorNumerico,
        vigenciaDesde: formData.vigenciaDesde.startOf('day').toISOString(),
        vigenciaHasta: formData.vigenciaHasta.endOf('day').toISOString()
      };

      // Solo agregar descripción si tiene un valor no vacío
      const descripcionTrimmed = formData.descripcion?.trim();
      if (descripcionTrimmed) {
        dataToSend.descripcion = descripcionTrimmed;
      }

      logger.debug('Enviando datos:', dataToSend); // Para debugging

      const response = await fetch(url, {
        method: selectedExtra ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Error al guardar el extra');
      }

      setSuccessMessage(selectedExtra ? 'Extra actualizado correctamente' : 'Extra creado correctamente');
      handleCloseModal();
      fetchExtras();
    } catch (error) {
      logger.error('Error en handleSubmit:', error);
      setErrorMessage(error.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este extra?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/extras/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar el extra');

      setSuccessMessage('Extra eliminado correctamente');
      fetchExtras();
    } catch (error) {
      setErrorMessage('Error al eliminar el extra: ' + error.message);
    }
  };

  const handleCloseAlert = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Gestión de Extras - {cliente}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpenModal()}
          >
            Agregar nuevo extra
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vigencia desde</TableCell>
              <TableCell>Vigencia hasta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {extras.map((extra) => (
              <TableRow key={extra._id}>
                <TableCell>{extra.tipo}</TableCell>
                <TableCell>{extra.descripcion}</TableCell>
                <TableCell>{extra.valor}</TableCell>
                <TableCell>{formatISODate(extra.vigenciaDesde)}</TableCell>
                <TableCell>{formatISODate(extra.vigenciaHasta)}</TableCell>
                <TableCell>
                  <IconButton 
                    color="primary"
                    onClick={() => handleOpenModal(extra)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error"
                    onClick={() => handleDelete(extra._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedExtra ? 'Editar Extra' : 'Agregar Nuevo Extra'}
          </DialogTitle>
          <DialogContent>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="tipo"
                    label="Tipo de Extra"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                    helperText="Ejemplo: OPERATIVO, PEAJE, etc."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="valor"
                    label="Valor"
                    type="number"
                    value={formData.valor}
                    onChange={handleInputChange}
                    required
                    inputProps={{ 
                      step: "0.01",
                      min: "0"
                    }}
                    helperText="Valor numérico mayor a 0"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="descripcion"
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                    helperText="Descripción opcional del extra"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Vigencia desde"
                    value={formData.vigenciaDesde}
                    onChange={(date) => handleDateChange('vigenciaDesde', date)}
                    format={DATE_FORMAT}
                    slotProps={{
                      textField: {
                        required: true,
                        helperText: 'Fecha de inicio de vigencia'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Vigencia hasta"
                    value={formData.vigenciaHasta}
                    onChange={(date) => handleDateChange('vigenciaHasta', date)}
                    format={DATE_FORMAT}
                    slotProps={{
                      textField: {
                        required: true,
                        helperText: 'Fecha de fin de vigencia'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isLoading || !formData.tipo || !formData.valor || !formData.vigenciaDesde || !formData.vigenciaHasta}
            >
              {isLoading ? 'Guardando...' : (selectedExtra ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExtrasManager; 