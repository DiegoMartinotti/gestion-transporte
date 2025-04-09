import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel,
  Select, MenuItem, FormHelperText, Grid,
  Switch, FormControlLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';

/**
 * Formulario para crear/editar fórmulas personalizadas
 * @param {Object} props
 * @param {boolean} props.open - Controla si el diálogo está abierto
 * @param {Object} props.formula - Fórmula a editar (null para nueva)
 * @param {string} props.tipoUnidad - Tipo de unidad seleccionado
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {Function} props.onSave - Función para guardar la fórmula
 */
const FormulaForm = ({ open, formula, tipoUnidad, onClose, onSave }) => {
  // Estados para los campos del formulario
  const [formulaData, setFormulaData] = useState({
    tipoUnidad: tipoUnidad || 'General',
    formula: '',
    vigenciaDesde: new Date(),
    vigenciaHasta: null,
    vigenciaIndefinida: true
  });
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({});

  // Inicializar el formulario cuando se abre o cambia la fórmula
  useEffect(() => {
    if (formula) {
      setFormulaData({
        tipoUnidad: formula.tipoUnidad || tipoUnidad,
        formula: formula.formula || '',
        vigenciaDesde: formula.vigenciaDesde ? new Date(formula.vigenciaDesde) : new Date(),
        vigenciaHasta: formula.vigenciaHasta ? new Date(formula.vigenciaHasta) : null,
        vigenciaIndefinida: !formula.vigenciaHasta
      });
    } else {
      // Valores por defecto para nueva fórmula
      setFormulaData({
        tipoUnidad: tipoUnidad || 'General',
        formula: '',
        vigenciaDesde: new Date(),
        vigenciaHasta: null,
        vigenciaIndefinida: true
      });
    }
    setErrors({});
  }, [formula, tipoUnidad, open]);

  /**
   * Maneja cambios en los campos del formulario
   * @param {string} field - Nombre del campo
   * @param {any} value - Valor del campo
   */
  const handleChange = (field, value) => {
    setFormulaData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo modificado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Maneja el cambio en el switch de vigencia indefinida
   */
  const handleVigenciaIndefinidaChange = (event) => {
    const isIndefinida = event.target.checked;
    setFormulaData(prev => ({
      ...prev,
      vigenciaIndefinida: isIndefinida,
      vigenciaHasta: isIndefinida ? null : prev.vigenciaHasta || new Date(prev.vigenciaDesde)
    }));
  };

  /**
   * Valida el formulario antes de enviar
   * @returns {boolean} True si es válido, false si hay errores
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!formulaData.formula.trim()) {
      newErrors.formula = 'La fórmula es requerida';
    }
    
    if (!formulaData.vigenciaDesde) {
      newErrors.vigenciaDesde = 'La fecha de inicio es requerida';
    }
    
    if (!formulaData.vigenciaIndefinida && !formulaData.vigenciaHasta) {
      newErrors.vigenciaHasta = 'La fecha de fin es requerida si no es indefinida';
    }
    
    if (formulaData.vigenciaDesde && formulaData.vigenciaHasta &&
        formulaData.vigenciaDesde >= formulaData.vigenciaHasta) {
      newErrors.vigenciaHasta = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = () => {
    if (validateForm()) {
      const dataToSave = {
        tipoUnidad: formulaData.tipoUnidad,
        formula: formulaData.formula,
        vigenciaDesde: formulaData.vigenciaDesde,
        vigenciaHasta: formulaData.vigenciaIndefinida ? null : formulaData.vigenciaHasta
      };
      
      onSave(dataToSave);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {formula ? 'Editar Fórmula Personalizada' : 'Nueva Fórmula Personalizada'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Unidad</InputLabel>
              <Select
                value={formulaData.tipoUnidad}
                onChange={(e) => handleChange('tipoUnidad', e.target.value)}
                label="Tipo de Unidad"
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Sider">Sider</MenuItem>
                <MenuItem value="Bitren">Bitren</MenuItem>
              </Select>
              <FormHelperText>
                Tipo de unidad a la que aplica esta fórmula
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Fórmula de Cálculo"
              fullWidth
              value={formulaData.formula}
              onChange={(e) => handleChange('formula', e.target.value)}
              error={!!errors.formula}
              helperText={errors.formula || 'Ejemplo: Valor * Palets + Peaje'}
              placeholder="Valor * Palets + Peaje"
            />
          </Grid>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Vigencia Desde"
                value={formulaData.vigenciaDesde}
                onChange={(date) => handleChange('vigenciaDesde', date)}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.vigenciaDesde,
                    helperText: errors.vigenciaDesde
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formulaData.vigenciaIndefinida}
                    onChange={handleVigenciaIndefinidaChange}
                  />
                }
                label="Vigencia indefinida"
              />
              
              {!formulaData.vigenciaIndefinida && (
                <DatePicker
                  label="Vigencia Hasta"
                  value={formulaData.vigenciaHasta}
                  onChange={(date) => handleChange('vigenciaHasta', date)}
                  format="dd/MM/yyyy"
                  minDate={formulaData.vigenciaDesde}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.vigenciaHasta,
                      helperText: errors.vigenciaHasta || 'Debe ser posterior a Vigencia Desde'
                    }
                  }}
                />
              )}
            </Grid>
          </LocalizationProvider>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormulaForm; 