import React from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import PropTypes from 'prop-types';
import { theme } from './theme';

/**
 * Proveedor de tema para la aplicación
 * Envuelve la aplicación con el tema personalizado y aplica estilos base
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 * @returns {React.Component} Proveedor de tema
 */
export const ThemeProvider = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Exportamos el tema para poder acceder a él directamente si es necesario
export { theme };

// Exportamos constantes de tema para usar en la aplicación
export const SPACING = 8; // Unidad base de espaciado 