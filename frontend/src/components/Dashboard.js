import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
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

  const menuItems = [
    {
      title: 'Gestión de Clientes',
      description: 'Administrar clientes, sites y tarifarios',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: 'clientes'  // Sin slash inicial
    },
    {
      title: 'Gestión de Viajes',
      description: 'Administrar viajes y seguimiento',
      icon: <LocalShippingIcon sx={{ fontSize: 40 }} />,
      path: 'viajes'  // Sin slash inicial
    },
    {
      title: 'Calcular Tarifa',
      description: 'Calcular tarifas por ruta y cliente',
      icon: <CalculateIcon sx={{ fontSize: 40 }} />,
      path: 'calcular-tarifa'  // Sin slash inicial
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Routes>
        <Route path="clientes" element={<ClientesManager />} />
        <Route path="viajes" element={<ViajesManager />} />
        <Route path="calcular-tarifa" element={<CalcularTarifa />} />
        <Route index element={
          <Grid container spacing={3}>
            {menuItems.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        } />
      </Routes>
    </Container>
  );
};

export default Dashboard;
