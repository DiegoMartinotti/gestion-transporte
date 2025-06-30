import { Routes, Route } from 'react-router-dom';
import { Container, Text } from '@mantine/core';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteDetailPage from './pages/clientes/ClienteDetailPage';
import ClienteFormPage from './pages/clientes/ClienteFormPage';
import EmpresasPage from './pages/empresas/EmpresasPage';
import EmpresaDetailPage from './pages/empresas/EmpresaDetailPage';
import { PersonalPage } from './pages/personal/PersonalPage';
import { SitesPage } from './pages/sites';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        
        {/* Clientes routes */}
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/new" element={<ClienteFormPage />} />
        <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        <Route path="/clientes/:id/edit" element={<ClienteFormPage />} />
        <Route path="/clientes/:clienteId/sites" element={<Container><Text>Sites del Cliente - Coming Soon</Text></Container>} />
        <Route path="/clientes/:clienteId/tramos" element={<Container><Text>Tramos del Cliente - Coming Soon</Text></Container>} />
        
        {/* Empresas routes */}
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/empresas/:id" element={<EmpresaDetailPage />} />
        <Route path="/empresas/:id/edit" element={<Container><Text>Empresa Edit - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/personal" element={<Container><Text>Personal de la Empresa - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/vehiculos" element={<Container><Text>Vehículos de la Empresa - Coming Soon</Text></Container>} />
        
        {/* Other routes */}
        <Route path="/personal" element={<PersonalPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/tramos" element={<Container><Text>Tramos - Coming Soon</Text></Container>} />
        <Route path="/vehiculos" element={<Container><Text>Vehículos - Coming Soon</Text></Container>} />
        <Route path="/viajes" element={<Container><Text>Viajes - Coming Soon</Text></Container>} />
      </Route>
    </Routes>
  );
}