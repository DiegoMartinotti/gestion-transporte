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
import Tarifario from './components/Tarifario';
import Navbar from './components/Navbar';
import { Box, Container } from '@mui/material';

// Componente de protección de rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Dashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tarifario" 
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Tarifario />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
