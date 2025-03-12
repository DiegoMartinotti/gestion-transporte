/**
 * @module components/Login
 * @description Componente de autenticación que maneja el inicio de sesión de usuarios.
 * Implementa un formulario con validación y manejo de errores, utilizando Material-UI
 * para una interfaz moderna y responsive.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  useTheme
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

/**
 * Componente de formulario de inicio de sesión
 * 
 * @component
 * @example
 * return (
 *   <Login />
 * )
 * 
 * @description
 * Este componente maneja el proceso de autenticación de usuarios.
 * Características principales:
 * - Formulario con validación de campos
 * - Manejo de errores de autenticación
 * - Interfaz responsiva con Material-UI
 * - Almacenamiento seguro del token JWT
 * - Redirección post-login
 * 
 * Decisiones de diseño:
 * 1. Se utiliza un formulario controlado para mejor manejo del estado
 * 2. Se implementa Material-UI para consistencia visual
 * 3. Se usa AuthContext para gestión centralizada de autenticación
 * 4. Se implementa manejo de errores con feedback visual
 * 5. Se utiliza cookie HTTP-only para almacenar el token
 */
const Login = () => {
  /**
   * Estado para los datos del formulario
   * Se utiliza un objeto para mantener todos los campos relacionados juntos
   * 
   * @type {[{email: string, password: string}, Function]} 
   */
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  
  /**
   * Estado para mensajes de error
   * Se usa para mostrar feedback al usuario sobre problemas de autenticación
   * 
   * @type {[string, Function]} 
   */
  const [error, setError] = useState('');
  
  /**
   * Hook de autenticación del contexto
   * Proporciona la función login para realizar la autenticación
   * 
   * @type {Object} 
   * @property {Function} login - Función para autenticar al usuario
   */
  const { login } = useAuth();
  
  /**
   * Hook para acceder al tema de Material-UI
   * Permite personalización consistente de estilos
   * 
   * @type {Object} 
   */
  const theme = useTheme();
  
  /**
   * Hook de navegación de React Router
   * Usado para redirección post-login
   * 
   * @type {Function} 
   */
  const navigate = useNavigate();

  /**
   * Maneja los cambios en los campos del formulario
   * Actualiza el estado manteniendo los valores previos
   * 
   * @function
   * @param {Object} e - Evento del campo de formulario
   * @param {string} e.target.name - Nombre del campo (email/password)
   * @param {string} e.target.value - Nuevo valor del campo
   */
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  /**
   * Maneja el envío del formulario de login
   * Realiza la autenticación y maneja errores
   * 
   * @async
   * @function
   * @param {Object} e - Evento del formulario
   * @throws {Error} Si hay problemas con la autenticación
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error en el login');
      }

      await login(data.token);
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LockIcon sx={{ fontSize: 32, color: 'background.paper' }} />
            </Box>
            <Typography component="h1" variant="h5" sx={{ color: 'text.primary' }}>
              Iniciar Sesión
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                }
              }}
            >
              Ingresar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
