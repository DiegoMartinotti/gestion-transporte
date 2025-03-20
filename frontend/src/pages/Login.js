/**
 * @module pages/Login
 * @description Página de autenticación que maneja el inicio de sesión de usuarios.
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
 */
const Login = () => {
  /**
   * Estado para los datos del formulario
   */
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  
  /**
   * Estado para mensajes de error
   */
  const [error, setError] = useState('');
  
  /**
   * Hook de autenticación del contexto
   */
  const { login } = useAuth();
  
  /**
   * Hook para acceder al tema de Material-UI
   */
  const theme = useTheme();
  
  /**
   * Hook de navegación de React Router
   */
  const navigate = useNavigate();

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  /**
   * Maneja el envío del formulario de login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(formData);
      
      if (!result.success) {
        throw new Error(result.message || 'Error en el login');
      }
      
      // La redirección se maneja en el método login del AuthContext
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
                py: 1.2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
                boxShadow: `0 4px 10px rgba(0, 0, 0, 0.1)`,
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 