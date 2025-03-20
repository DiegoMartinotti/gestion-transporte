import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Grid, 
  FormControlLabel, 
  Switch, 
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import empresaService from '../../services/empresaService';
import useNotification from '../../hooks/useNotification';

/**
 * Componente de formulario para crear o editar empresas
 * @component
 */
const EmpresaForm = ({ open, onClose, empresa, onSave }) => {
  // Estado inicial del formulario
  const initialFormState = {
    nombre: '',
    razonSocial: '',
    cuit: '',
    telefono: '',
    email: '',
    direccion: '',
    localidad: '',
    provincia: '',
    codigo: '',
    esTransportista: false
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();
  
  // Cargar datos de la empresa si se está editando
  useEffect(() => {
    if (empresa) {
      setFormData({
        nombre: empresa.nombre || '',
        razonSocial: empresa.razonSocial || '',
        cuit: empresa.cuit || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        direccion: empresa.direccion || '',
        localidad: empresa.localidad || '',
        provincia: empresa.provincia || '',
        codigo: empresa.codigo || '',
        esTransportista: empresa.esTransportista || false
      });
    } else {
      setFormData(initialFormState);
    }
  }, [empresa]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: e.target.type === 'checkbox' ? checked : value
    });
  };
  
  // Validar formulario
  const validateForm = () => {
    const errors = [];
    
    if (!formData.nombre.trim()) errors.push('El nombre es requerido');
    if (!formData.razonSocial.trim()) errors.push('La razón social es requerida');
    if (!formData.cuit.trim()) errors.push('El CUIT es requerido');
    
    // Validar formato de CUIT
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (formData.cuit && !cuitRegex.test(formData.cuit)) {
      errors.push('El CUIT debe tener el formato XX-XXXXXXXX-X');
    }
    
    // Validar email si fue proporcionado
    if (formData.email) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(formData.email)) {
        errors.push('El formato del email es inválido');
      }
    }
    
    return errors;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (empresa?._id) {
        // Actualizar empresa existente
        response = await empresaService.updateEmpresa(empresa._id, formData);
        showNotification('Empresa actualizada correctamente', 'success');
      } else {
        // Crear nueva empresa
        response = await empresaService.createEmpresa(formData);
        showNotification('Empresa creada correctamente', 'success');
      }
      
      if (onSave) {
        onSave(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar empresa:', error);
      setError(['Error al guardar empresa: ' + (error.response?.data?.message || error.message)]);
      showNotification('Error al guardar empresa', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {empresa?._id ? 'Editar Empresa' : 'Nueva Empresa'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {Array.isArray(error) ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {error.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              ) : (
                error
              )}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                autoFocus
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="razonSocial"
                label="Razón Social"
                value={formData.razonSocial}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="cuit"
                label="CUIT (XX-XXXXXXXX-X)"
                value={formData.cuit}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                placeholder="30-12345678-9"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="codigo"
                label="Código Interno"
                value={formData.codigo}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefono"
                label="Teléfono"
                value={formData.telefono}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="direccion"
                label="Dirección"
                value={formData.direccion}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="localidad"
                label="Localidad"
                value={formData.localidad}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="provincia"
                label="Provincia"
                value={formData.provincia}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.esTransportista}
                    onChange={handleChange}
                    name="esTransportista"
                    color="primary"
                  />
                }
                label="Es Transportista"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

EmpresaForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  empresa: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default EmpresaForm; 