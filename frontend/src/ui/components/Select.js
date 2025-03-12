import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  OutlinedInput,
} from '@mui/material';

/**
 * Componente de selección (desplegable) reutilizable
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.id - ID del componente
 * @param {string} props.label - Etiqueta del componente
 * @param {string|Array} props.value - Valor seleccionado
 * @param {Function} props.onChange - Función a ejecutar al cambiar el valor
 * @param {Array} props.options - Opciones disponibles (array de objetos con value y label)
 * @param {boolean} props.multiple - Permitir selección múltiple
 * @param {boolean} props.required - Indicar si el campo es obligatorio
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helperText - Texto de ayuda
 * @param {boolean} props.disabled - Deshabilitar el componente
 * @param {boolean} props.fullWidth - Ocupar todo el ancho disponible
 * @param {string} props.size - Tamaño del componente (small, medium)
 * @param {Object} props.sx - Estilos adicionales
 * @returns {React.Component} Componente de selección
 */
const Select = ({
  id,
  label,
  value,
  onChange,
  options,
  multiple = false,
  required = false,
  error = '',
  helperText = '',
  disabled = false,
  fullWidth = true,
  size = 'medium',
  sx = {},
}) => {
  // Función para renderizar el valor seleccionado en caso de selección múltiple
  const renderValue = (selected) => {
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return <em>Seleccionar</em>;
    }

    if (multiple) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Chip 
                key={value} 
                label={option ? option.label : value} 
                size="small" 
              />
            );
          })}
        </Box>
      );
    }

    const option = options.find((opt) => opt.value === selected);
    return option ? option.label : selected;
  };

  return (
    <FormControl
      variant="outlined"
      fullWidth={fullWidth}
      required={required}
      error={!!error}
      disabled={disabled}
      size={size}
      sx={sx}
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <MuiSelect
        labelId={`${id}-label`}
        id={id}
        value={value || (multiple ? [] : '')}
        onChange={onChange}
        input={<OutlinedInput label={label} />}
        multiple={multiple}
        renderValue={renderValue}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 48 * 4.5 + 8,
              width: 250,
            },
          },
        }}
      >
        {!required && !multiple && (
          <MenuItem value="">
            <em>Ninguno</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {(helperText || error) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  );
};

Select.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  multiple: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  sx: PropTypes.object,
};

export default Select; 