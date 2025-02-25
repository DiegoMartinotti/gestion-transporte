import React, { useState } from 'react';
import { 
  Button, 
  Container, 
  Typography, 
  Box,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import EnhancedTable from './EnhancedTable';
import ClientesManager from './ClientesManager';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState(null);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Panel de Control
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container>
        {!currentView ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            gap={3} 
            mt={5}
          >
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setCurrentView('viajes')}
              fullWidth
              style={{ maxWidth: 300 }}
            >
              Gestionar Viajes
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => setCurrentView('clientes')}
              fullWidth
              style={{ maxWidth: 300 }}
            >
              Gestionar Clientes
            </Button>
          </Box>
        ) : (
          <Box mt={3}>
            <Button 
              variant="outlined" 
              onClick={() => setCurrentView(null)}
              style={{ marginBottom: 20 }}
            >
              Volver al Panel
            </Button>
            {currentView === 'viajes' ? <EnhancedTable /> : <ClientesManager />}
          </Box>
        )}
      </Container>
    </>
  );
};

export default Dashboard;
