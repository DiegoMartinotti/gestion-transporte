import { MantineProvider, Container, Text } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { ErrorBoundary } from './components/base';
import { AuthProvider } from './contexts/AuthContext';
import { EntityNamesProvider } from './contexts/EntityNamesContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteDetailPage from './pages/clientes/ClienteDetailPage';
import ClienteFormPage from './pages/clientes/ClienteFormPage';
import EmpresasPage from './pages/empresas/EmpresasPage';
import EmpresaDetailPage from './pages/empresas/EmpresaDetailPage';
import { PersonalPage } from './pages/personal/PersonalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/spotlight/styles.css';

function AppContent() {
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
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/new" element={<ClienteFormPage />} />
        <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        <Route path="/clientes/:id/edit" element={<ClienteFormPage />} />
        <Route path="/clientes/:clienteId/sites" element={<Container><Text>Sites del Cliente - Coming Soon</Text></Container>} />
        <Route path="/clientes/:clienteId/tramos" element={<Container><Text>Tramos del Cliente - Coming Soon</Text></Container>} />
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/empresas/:id" element={<EmpresaDetailPage />} />
        <Route path="/empresas/:id/edit" element={<Container><Text>Empresa Edit - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/personal" element={<Container><Text>Personal de la Empresa - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/vehiculos" element={<Container><Text>Vehículos de la Empresa - Coming Soon</Text></Container>} />
        <Route path="/personal" element={<PersonalPage />} />
        <Route path="/sites" element={<Container><Text>Sites - Coming Soon</Text></Container>} />
        <Route path="/tramos" element={<Container><Text>Tramos - Coming Soon</Text></Container>} />
        <Route path="/vehiculos" element={<Container><Text>Vehículos - Coming Soon</Text></Container>} />
        <Route path="/viajes" element={<Container><Text>Viajes - Coming Soon</Text></Container>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications />
        <ModalsProvider>
          <BrowserRouter>
            <AuthProvider>
              <EntityNamesProvider>
                <AppContent />
              </EntityNamesProvider>
            </AuthProvider>
          </BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </ErrorBoundary>
  );
}

export default App;