/************************************************************
 * App.js
 * ---------------------------------------------------------
 * Componente principal de la aplicación React. Aquí se 
 * integran Login y EnhancedTable.
 ************************************************************/
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Vehiculos from './pages/Vehiculos';
import Tramos from './pages/Tramos';
import Clientes from './pages/Clientes';
import Empresas from './pages/Empresas';
import Navbar from './components/Navbar';
import { Box, Container, CircularProgress } from '@mui/material';
import { ThemeProvider } from './theme';
import useAuth from './hooks/useAuth';
import ViajesManager from './components/ViajesManager';
import CalcularTarifa from './components/CalcularTarifa';
import PersonalManager from './components/PersonalManager';

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Layout para rutas autenticadas
const AuthenticatedLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <Container 
        component="main" 
        sx={{
          flexGrow: 1,
          paddingTop: '64px', // Navbar height
          height: 'calc(100vh - 64px)', // Full height minus Navbar
          overflow: 'auto'
        }}
      >
        {children}
      </Container>
    </>
  );
};

// Componente principal de la aplicación
const AppContent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        {[
          { path: "/", element: <Dashboard /> },
          { path: "/vehiculos", element: <Vehiculos /> },
          { path: "/vehiculos/:empresaId", element: <Vehiculos /> },
          { path: "/tramos", element: <Tramos /> },
          { path: "/clientes", element: <Clientes /> },
          { path: "/viajes", element: <ViajesManager /> },
          { path: "/calcular-tarifa", element: <CalcularTarifa /> },
          { path: "/empresas", element: <Empresas /> },
          { path: "/personal/:empresaId", element: <PersonalManager /> }
        ].map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  {route.element}
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
