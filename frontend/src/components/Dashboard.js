import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Paper, Typography, useTheme } from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import ViajesManager from './ViajesManager';
import ClientesManager from './ClientesManager';
import CalcularTarifa from './CalcularTarifa';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const menuItems = [
    {
      title: 'Gestión de Clientes',
      description: 'Administrar clientes, sites y tarifarios',
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
      path: 'clientes'
    },
    {
      title: 'Gestión de Viajes',
      description: 'Administrar viajes y seguimiento',
      icon: <LocalShippingIcon sx={{ fontSize: 48 }} />,
      path: 'viajes'
    },
    {
      title: 'Calcular Tarifa',
      description: 'Calcular tarifas por ruta y cliente',
      icon: <CalculateIcon sx={{ fontSize: 48 }} />,
      path: 'calcular-tarifa'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Routes>
        <Route path="clientes" element={<ClientesManager />} />
        <Route path="viajes" element={<ViajesManager />} />
        <Route path="calcular-tarifa" element={<CalcularTarifa />} />
        <Route index element={
          <Box sx={{ pt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
              Panel de Control
            </Typography>
            <Grid container spacing={4}>
              {menuItems.map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      height: '100%',
                      transition: 'all 0.3s ease-in-out',
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
                        '& .icon': {
                          color: 'primary.main',
                          transform: 'scale(1.1)',
                        }
                      },
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <Box 
                      className="icon"
                      sx={{ 
                        color: 'secondary.main',
                        mb: 3,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary" 
                      align="center"
                      sx={{ 
                        opacity: 0.8,
                        maxWidth: '80%'
                      }}
                    >
                      {item.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        } />
      </Routes>
    </Container>
  );
};

export default Dashboard;
