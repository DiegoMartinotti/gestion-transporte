import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, FormControl, InputLabel, 
  Select, MenuItem, CircularProgress, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import es from 'date-fns/locale/es';
import tramoService from '../../services/tramoService';
import useNotification from '../../hooks/useNotification';

const METODOS_CALCULO = ['Kilometro', 'Fijo', 'Hora'];
const TIPOS_TRAMO = [
  { value: 'TRMC', label: 'Tramo Completo' },
  { value: 'TRMI', label: 'Tramo Intermedio' }
];

const TramoForm = ({ open, onClose, onSave, tramo, cliente, sites = [] }) => {
  const initialState = {
    origen: '',
    destino: '',
    tipo: 'TRMC',
    metodoCalculo: 'Kilometro',
    valor: 0,
    valorPeaje: 0,
    vigenciaDesde: new Date(),
    vigenciaHasta: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showNotification } = useNotification();
  const isEdit = !!tramo?._id;
  
  useEffect(() => {
    if (tramo && open) {
      // Formatear datos del tramo para el formulario
      setFormData({
        origen: tramo.origen || '',
        destino: tramo.destino || '',
        tipo: tramo.tarifaHistorica?.tipo || tramo.tipo || 'TRMC',
        metodoCalculo: tramo.tarifaHistorica?.metodoCalculo || tramo.metodoCalculo || 'Kilometro',
        valor: tramo.tarifaHistorica?.valor || tramo.valor || 0,
        valorPeaje: tramo.tarifaHistorica?.valorPeaje || tramo.valorPeaje || 0,
        vigenciaDesde: tramo.tarifaHistorica?.vigenciaDesde ? new Date(tramo.tarifaHistorica.vigenciaDesde) : new Date(),
        vigenciaHasta: tramo.tarifaHistorica?.vigenciaHasta ? new Date(tramo.tarifaHistorica.vigenciaHasta) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      });
    } else if (open) {
      // Resetear el formulario cuando se abre para un nuevo tramo
      setFormData(initialState);
    }
    // Limpiar errores cuando se abre el diálogo
    setErrors({});
  }, [open, tramo]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.origen) newErrors.origen = 'El origen es requerido';
    if (!formData.destino) newErrors.destino = 'El destino es requerido';
    if (formData.origen === formData.destino) newErrors.destino = 'El destino no puede ser igual al origen';
    if (!formData.tipo) newErrors.tipo = 'El tipo es requerido';
    if (!formData.metodoCalculo) newErrors.metodoCalculo = 'El método de cálculo es requerido';
    if (formData.valor < 0) newErrors.valor = 'El valor no puede ser negativo';
    if (formData.valorPeaje < 0) newErrors.valorPeaje = 'El valor del peaje no puede ser negativo';
    if (!formData.vigenciaDesde) newErrors.vigenciaDesde = 'La fecha de inicio es requerida';
    if (!formData.vigenciaHasta) newErrors.vigenciaHasta = 'La fecha de fin es requerida';
    if (formData.vigenciaDesde && formData.vigenciaHasta && 
        new Date(formData.vigenciaDesde) > new Date(formData.vigenciaHasta)) {
      newErrors.vigenciaHasta = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const handleDateChange = (name, date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Preparar datos para enviar al servidor
      const tramoData = {
        origen: formData.origen,
        destino: formData.destino,
        tarifaHistorica: {
          tipo: formData.tipo,
          metodoCalculo: formData.metodoCalculo,
          valor: formData.valor,
          valorPeaje: formData.valorPeaje,
          vigenciaDesde: formData.vigenciaDesde.toISOString(),
          vigenciaHasta: formData.vigenciaHasta.toISOString()
        },
        cliente
      };
      
      let response;
      if (isEdit) {
        response = await tramoService.updateTramo(tramo._id, tramoData);
        showNotification('Tramo actualizado correctamente', 'success');
      } else {
        response = await tramoService.createTramo(tramoData);
        showNotification('Tramo creado correctamente', 'success');
      }
      
      if (onSave) onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Error al guardar tramo:', error);
      showNotification(
        `Error al ${isEdit ? 'actualizar' : 'crear'} el tramo: ${error.response?.data?.message || error.message}`, 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        {isEdit ? 'Editar Tramo' : 'Nuevo Tramo'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.origen}>
              <InputLabel id="origen-label">Origen</InputLabel>
              <Select
                labelId="origen-label"
                id="origen"
                name="origen"
                value={formData.origen}
                label="Origen"
                onChange={handleInputChange}
              >
                {sites.map(site => (
                  <MenuItem key={site._id} value={site._id}>
                    {site.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.origen && <FormHelperText>{errors.origen}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.destino}>
              <InputLabel id="destino-label">Destino</InputLabel>
              <Select
                labelId="destino-label"
                id="destino"
                name="destino"
                value={formData.destino}
                label="Destino"
                onChange={handleInputChange}
              >
                {sites.map(site => (
                  <MenuItem key={site._id} value={site._id}>
                    {site.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.destino && <FormHelperText>{errors.destino}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.tipo}>
              <InputLabel id="tipo-label">Tipo de Tramo</InputLabel>
              <Select
                labelId="tipo-label"
                id="tipo"
                name="tipo"
                value={formData.tipo}
                label="Tipo de Tramo"
                onChange={handleInputChange}
              >
                {TIPOS_TRAMO.map(tipo => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.tipo && <FormHelperText>{errors.tipo}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.metodoCalculo}>
              <InputLabel id="metodo-calculo-label">Método de Cálculo</InputLabel>
              <Select
                labelId="metodo-calculo-label"
                id="metodoCalculo"
                name="metodoCalculo"
                value={formData.metodoCalculo}
                label="Método de Cálculo"
                onChange={handleInputChange}
              >
                {METODOS_CALCULO.map(metodo => (
                  <MenuItem key={metodo} value={metodo}>
                    {metodo}
                  </MenuItem>
                ))}
              </Select>
              {errors.metodoCalculo && <FormHelperText>{errors.metodoCalculo}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="valor"
              name="valor"
              label="Valor Base"
              type="number"
              value={formData.valor}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              error={!!errors.valor}
              helperText={errors.valor}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="valorPeaje"
              name="valorPeaje"
              label="Valor Peaje"
              type="number"
              value={formData.valorPeaje}
              onChange={handleNumberChange}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              error={!!errors.valorPeaje}
              helperText={errors.valorPeaje}
            />
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Vigencia Desde"
                value={formData.vigenciaDesde}
                onChange={(date) => handleDateChange('vigenciaDesde', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.vigenciaDesde,
                    helperText: errors.vigenciaDesde
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Vigencia Hasta"
                value={formData.vigenciaHasta}
                onChange={(date) => handleDateChange('vigenciaHasta', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.vigenciaHasta,
                    helperText: errors.vigenciaHasta
                  }
                }}
              />
            </Grid>
          </LocalizationProvider>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TramoForm; 