/**
 * @module components/vehiculos/VehiculoForm
 * @description Componente de formulario para la creación y edición de vehículos
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Grid,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';

// Valores predefinidos para referencia
const TIPOS_VEHICULO = [
  'Camión',
  'Acoplado',
  'Semirremolque',
  'Bitren',
  'Furgón',
  'Utilitario'
];

/**
 * Componente de formulario para vehículos
 * @component
 */
const VehiculoForm = ({
  formData,
  handleChange,
  handleDateChange,
  handleSubmit,
  handleUpdate,
  editingVehiculo,
  onCancel
}) => {

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      editingVehiculo ? handleUpdate(editingVehiculo) : handleSubmit(e);
    }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
            Datos Generales
          </Typography>
          <Divider />
        </Grid>
        
        {/* Datos Básicos */}
        <Grid item xs={12} md={4}>
          <TextField
            name="dominio"
            label="Dominio/Patente *"
            type="text"
            required
            fullWidth
            variant="outlined"
            value={formData.dominio}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="tipo-label">Tipo de Vehículo *</InputLabel>
            <Select
              labelId="tipo-label"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              label="Tipo de Vehículo *"
              required
            >
              {TIPOS_VEHICULO.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="año"
            label="Año"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.año}
            onChange={handleChange}
            inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="marca"
            label="Marca"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.marca}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="modelo"
            label="Modelo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.modelo}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="numeroChasis"
            label="Número de Chasis"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.numeroChasis}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="numeroMotor"
            label="Número de Motor"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.numeroMotor}
            onChange={handleChange}
          />
        </Grid>
        
        {/* Documentación */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Documentación
          </Typography>
          <Divider />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            name="documentacion.seguro.numero"
            label="Número de Seguro"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.documentacion.seguro.numero}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="documentacion.seguro.compania"
            label="Compañía de Seguro"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.documentacion.seguro.compania}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Vencimiento Seguro"
              value={formData.documentacion.seguro.vencimiento}
              onChange={(date) => handleDateChange(date, 'seguro', 'vencimiento')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="documentacion.vtv.numero"
            label="Número de VTV"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.documentacion.vtv.numero}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Vencimiento VTV"
              value={formData.documentacion.vtv.vencimiento}
              onChange={(date) => handleDateChange(date, 'vtv', 'vencimiento')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="documentacion.ruta.numero"
            label="Número de Ruta"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.documentacion.ruta.numero}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Vencimiento Ruta"
              value={formData.documentacion.ruta.vencimiento}
              onChange={(date) => handleDateChange(date, 'ruta', 'vencimiento')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        {/* Características */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Características
          </Typography>
          <Divider />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.capacidadCarga"
            label="Capacidad de Carga (kg)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.capacidadCarga}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.tara"
            label="Tara (kg)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.tara}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.configuracionEjes"
            label="Configuración de Ejes"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.configuracionEjes}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.largo"
            label="Largo (m)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.largo}
            onChange={handleChange}
            inputProps={{ step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.ancho"
            label="Ancho (m)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.ancho}
            onChange={handleChange}
            inputProps={{ step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="caracteristicas.alto"
            label="Alto (m)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.alto}
            onChange={handleChange}
            inputProps={{ step: 0.01 }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="caracteristicas.tipoCarroceria"
            label="Tipo de Carrocería"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.caracteristicas.tipoCarroceria}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={handleChange}
                name="activo"
                color="primary"
              />
            }
            label="Vehículo Activo"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="observaciones"
            label="Observaciones"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.observaciones}
            onChange={handleChange}
            multiline
            rows={4}
          />
        </Grid>
        
        {/* Botones */}
        <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
          <Grid item>
            <Button onClick={onCancel} color="secondary">
              Cancelar
            </Button>
          </Grid>
          <Grid item>
            <Button 
              type="submit"
              color="primary"
              variant="contained"
              startIcon={<SaveIcon />}
            >
              {editingVehiculo ? 'Actualizar' : 'Guardar'}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};

VehiculoForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleUpdate: PropTypes.func,
  editingVehiculo: PropTypes.object,
  onCancel: PropTypes.func.isRequired
};

export default VehiculoForm; 