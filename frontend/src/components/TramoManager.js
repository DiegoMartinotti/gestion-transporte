import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Button, TextField, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, Select, MenuItem, 
  Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Snackbar, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import Checkbox from '@mui/material/Checkbox';

// Configurar dayjs para usar español
dayjs.locale('es');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Reemplazar las inicializaciones de fecha con dayjs
const initialFormData = {
  origen: '',
  destino: '',
  tipo: 'TRMC',
  cliente: '',
  vigenciaDesde: dayjs(),
  vigenciaHasta: dayjs().add(1, 'year'),
  metodoCalculo: 'Kilometro',
  valorPeaje: 0
};

const TramoManager = () => {
  const [tramos, setTramos] = useState([]);
  const [sites, setSites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTramo, setSelectedTramo] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedTramos, setSelectedTramos] = useState([]);
  const [isVigenciaMasivaOpen, setIsVigenciaMasivaOpen] = useState(false);
  const [vigenciaMasiva, setVigenciaMasiva] = useState({
    vigenciaDesde: dayjs(),
    vigenciaHasta: dayjs().add(1, 'year')
  });

  useEffect(() => {
    fetchTramos();
    fetchSites();
  }, []);

  const fetchTramos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tramos`);
      setTramos(response.data);
    } catch (error) {
      setErrorMessage('Error al cargar los tramos: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await axios.get(`${API_URL}/sites`);
      setSites(response.data);
    } catch (error) {
      setErrorMessage('Error al cargar los sites: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenModal = (tramo = null) => {
    if (tramo) {
      // Para edición: Convertir las fechas de string a Date
      setFormData({
        ...tramo,
        vigenciaDesde: dayjs(tramo.vigenciaDesde),
        vigenciaHasta: dayjs(tramo.vigenciaHasta)
      });
      setSelectedTramo(tramo);
    } else {
      // Para creación
      setFormData(initialFormData);
      setSelectedTramo(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTramo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (name, date) => {
    setFormData({ 
      ...formData, 
      [name]: date 
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const dataToSend = {
        ...formData,
        vigenciaDesde: formData.vigenciaDesde.toISOString(),
        vigenciaHasta: formData.vigenciaHasta.toISOString()
      };

      if (selectedTramo) {
        await axios.put(`${API_URL}/tramos/${selectedTramo._id}`, dataToSend);
        setSuccessMessage('Tramo actualizado correctamente');
      } else {
        await axios.post(`${API_URL}/tramos`, dataToSend);
        setSuccessMessage('Tramo creado correctamente');
      }
      fetchTramos();
      handleCloseModal();
    } catch (error) {
      setErrorMessage('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTramo = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este tramo?')) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/tramos/${id}`);
      setSuccessMessage('Tramo eliminado correctamente');
      fetchTramos();
    } catch (error) {
      setErrorMessage('Error al eliminar el tramo: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Función auxiliar para mostrar el nombre del site en lugar de su ID
  const getSiteName = (siteId) => {
    const site = sites.find(s => s._id === siteId);
    return site ? site.Site : 'Desconocido';
  };

  const handleRowSelect = (tramoId) => {
    setSelectedTramos(prev => {
      if (prev.includes(tramoId)) {
        return prev.filter(id => id !== tramoId);
      } else {
        return [...prev, tramoId];
      }
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTramos(tramos.map(t => t._id));
    } else {
      setSelectedTramos([]);
    }
  };

  const handleVigenciaMasivaOpen = () => {
    if (selectedTramos.length === 0) {
      setErrorMessage('Debe seleccionar al menos un tramo para actualizar');
      return;
    }
    setIsVigenciaMasivaOpen(true);
  };

  const handleVigenciaMasivaClose = () => {
    setIsVigenciaMasivaOpen(false);
  };

  const handleVigenciaMasivaChange = (name, date) => {
    setVigenciaMasiva(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleVigenciaMasivaSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/tramos/updateVigenciaMasiva`, {
        tramosIds: selectedTramos,
        vigenciaDesde: vigenciaMasiva.vigenciaDesde.toISOString(),
        vigenciaHasta: vigenciaMasiva.vigenciaHasta.toISOString()
      });

      if (response.data.conflictos && response.data.conflictos.length > 0) {
        setErrorMessage(`Se actualizaron ${response.data.actualizados.length} tramos. ${response.data.conflictos.length} tramos tienen conflictos de fechas.`);
      } else {
        setSuccessMessage(`Se actualizaron ${response.data.actualizados.length} tramos correctamente`);
      }

      setIsVigenciaMasivaOpen(false);
      setSelectedTramos([]);
      fetchTramos();
    } catch (error) {
      setErrorMessage('Error al actualizar las vigencias: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Gestión de Tramos
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleVigenciaMasivaOpen}
            disabled={selectedTramos.length === 0}
            sx={{ mr: 2 }}
          >
            Actualizar vigencias ({selectedTramos.length})
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => handleOpenModal()}
          >
            Agregar nuevo tramo
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedTramos.length === tramos.length}
                  indeterminate={selectedTramos.length > 0 && selectedTramos.length < tramos.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Distancia (km)</TableCell>
              <TableCell>Método de cálculo</TableCell>
              <TableCell>Vigencia desde</TableCell>
              <TableCell>Vigencia hasta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tramos.map((tramo) => (
              <TableRow 
                key={tramo._id}
                selected={selectedTramos.includes(tramo._id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTramos.includes(tramo._id)}
                    onChange={() => handleRowSelect(tramo._id)}
                  />
                </TableCell>
                <TableCell>{getSiteName(tramo.origen)}</TableCell>
                <TableCell>{getSiteName(tramo.destino)}</TableCell>
                <TableCell>{tramo.cliente}</TableCell>
                <TableCell>{tramo.tipo}</TableCell>
                <TableCell>{tramo.distancia}</TableCell>
                <TableCell>{tramo.metodoCalculo}</TableCell>
                <TableCell>{new Date(tramo.vigenciaDesde).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(tramo.vigenciaHasta).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenModal(tramo)}
                  >
                    Editar
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteTramo(tramo._id)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Creación/Edición */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTramo ? 'Editar Tramo' : 'Agregar Nuevo Tramo'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="origen-label">Origen</InputLabel>
                  <Select
                    labelId="origen-label"
                    name="origen"
                    value={formData.origen}
                    onChange={handleInputChange}
                    label="Origen"
                    required
                  >
                    {sites.map((site) => (
                      <MenuItem key={site._id} value={site._id}>
                        {site.Site} - {site.Descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="destino-label">Destino</InputLabel>
                  <Select
                    labelId="destino-label"
                    name="destino"
                    value={formData.destino}
                    onChange={handleInputChange}
                    label="Destino"
                    required
                  >
                    {sites.map((site) => (
                      <MenuItem key={site._id} value={site._id}>
                        {site.Site} - {site.Descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="cliente"
                  label="Cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    label="Tipo"
                  >
                    <MenuItem value="TRMC">TRMC</MenuItem>
                    <MenuItem value="TMRI">TMRI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Vigencia desde"
                  value={formData.vigenciaDesde}
                  onChange={(date) => handleDateChange('vigenciaDesde', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Vigencia hasta"
                  value={formData.vigenciaHasta}
                  onChange={(date) => handleDateChange('vigenciaHasta', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="metodo-calculo-label">Método de cálculo</InputLabel>
                  <Select
                    labelId="metodo-calculo-label"
                    name="metodoCalculo"
                    value={formData.metodoCalculo}
                    onChange={handleInputChange}
                    label="Método de cálculo"
                    required
                  >
                    <MenuItem value="Palet">Palet</MenuItem>
                    <MenuItem value="Kilometro">Kilometro</MenuItem>
                    <MenuItem value="Fijo">Fijo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="valorPeaje"
                  label="Valor del peaje"
                  type="number"
                  value={formData.valorPeaje}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Actualización Masiva de Vigencias */}
      <Dialog 
        open={isVigenciaMasivaOpen} 
        onClose={handleVigenciaMasivaClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Actualizar Vigencias ({selectedTramos.length} tramos)
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Esta acción actualizará la vigencia de todos los tramos seleccionados.
                  Se validará que no haya conflictos con otros tramos existentes.
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Vigencia desde"
                  value={vigenciaMasiva.vigenciaDesde}
                  onChange={(date) => handleVigenciaMasivaChange('vigenciaDesde', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Vigencia hasta"
                  value={vigenciaMasiva.vigenciaHasta}
                  onChange={(date) => handleVigenciaMasivaChange('vigenciaHasta', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleVigenciaMasivaClose} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleVigenciaMasivaSubmit} 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Vigencias'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensajes de alerta */}
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

export default TramoManager;
