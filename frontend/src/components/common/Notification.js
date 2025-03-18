/**
 * @module components/common/Notification
 * @description Componente reutilizable para mostrar notificaciones al usuario
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Snackbar, Alert, Typography } from '@mui/material';

/**
 * Componente para mostrar notificaciones al usuario
 * 
 * @component
 * @example
 * <Notification 
 *   open={true} 
 *   message="Operación completada con éxito" 
 *   severity="success" 
 *   onClose={() => setOpen(false)} 
 * />
 */
const Notification = ({ 
  open, 
  message, 
  severity = 'info', 
  onClose, 
  autoHideDuration = 6000,
  variant = 'filled',
  position = { vertical: 'bottom', horizontal: 'center' }
}) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={autoHideDuration} 
      onClose={onClose}
      anchorOrigin={position}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant={variant}
        elevation={6}
        sx={{ width: '100%' }}
      >
        <Typography variant="body2">
          {message}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

Notification.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
  onClose: PropTypes.func.isRequired,
  autoHideDuration: PropTypes.number,
  variant: PropTypes.oneOf(['standard', 'filled', 'outlined']),
  position: PropTypes.shape({
    vertical: PropTypes.oneOf(['top', 'bottom']),
    horizontal: PropTypes.oneOf(['left', 'center', 'right'])
  })
};

export default Notification; 