import { MantineProvider, AppShell, Text, Container, Group, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { theme } from './theme';
import { ErrorBoundary, Breadcrumbs } from './components/base';
import { AuthProvider } from './contexts/AuthContext';
import { EntityNamesProvider } from './contexts/EntityNamesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/ui/Navigation';
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
  function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
      <ActionIcon
        onClick={() => toggleColorScheme()}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {colorScheme === 'dark' ? <IconSun size="1.2rem" /> : <IconMoon size="1.2rem" />}
      </ActionIcon>
    );
  }
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm' }}
            padding="md"
          >
            <AppShell.Header>
              <Container size="100%" px="md" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Group justify="space-between" style={{ width: '100%' }}>
                  <Text size="xl" fw={700}>
                    Sistema de Gestión de Transporte
                  </Text>
                  <ThemeToggle />
                </Group>
              </Container>
            </AppShell.Header>

            <AppShell.Navbar p="md">
              <Navigation />
            </AppShell.Navbar>

            <AppShell.Main>
              <Breadcrumbs />
              <Routes>
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
              </Routes>
            </AppShell.Main>
          </AppShell>
        </ProtectedRoute>
      } />
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