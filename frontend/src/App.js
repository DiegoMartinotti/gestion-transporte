/************************************************************
 * App.js
 * ---------------------------------------------------------
 * Componente principal de la aplicación React. Aquí se 
 * integran Login y EnhancedTable.
 ************************************************************/
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login'; // Asegúrate de que la ruta sea correcta
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { Box, Container, CircularProgress } from '@mui/material';
import { ThemeProvider } from './theme';

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Contenedor de la aplicación autenticada
const AuthenticatedLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      </Container>
    </>
  );
};

const AppContent = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Box>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
