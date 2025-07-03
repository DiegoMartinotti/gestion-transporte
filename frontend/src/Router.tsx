import { Routes, Route } from 'react-router-dom';
import { Container, Text } from '@mantine/core';
import { Suspense } from 'react';
import { lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import RouteLoader from './components/base/RouteLoader';

// Import críticos (cargados inmediatamente)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy loading para todas las páginas principales
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Gestión de entidades - Chunk de gestión
const ClientesPage = lazy(() => import('./pages/clientes/ClientesPage'));
const ClienteDetailPage = lazy(() => import('./pages/clientes/ClienteDetailPage'));
const ClienteFormPage = lazy(() => import('./pages/clientes/ClienteFormPage'));
const EmpresasPage = lazy(() => import('./pages/empresas/EmpresasPage'));
const EmpresaDetailPage = lazy(() => import('./pages/empresas/EmpresaDetailPage'));
const PersonalPage = lazy(() => import('./pages/personal/PersonalPage').then(module => ({ default: module.PersonalPage })));

// Operaciones - Chunk de operaciones
const SitesPage = lazy(() => import('./pages/sites').then(module => ({ default: module.SitesPage })));
const TramosPage = lazy(() => import('./pages/tramos/TramosPage'));
const VehiculosPage = lazy(() => import('./pages/vehiculos/VehiculosPage'));
const ViajesPage = lazy(() => import('./pages/viajes/ViajesPage').then(module => ({ default: module.ViajesPage })));
const ExtrasPage = lazy(() => import('./pages/extras/ExtrasPage').then(module => ({ default: module.ExtrasPage })));
const OrdenesCompraPage = lazy(() => import('./pages/ordenes-compra/OrdenesCompraPage').then(module => ({ default: module.OrdenesCompraPage })));

// Herramientas - Chunk de herramientas
const CalculadoraPage = lazy(() => import('./pages/calculadora/CalculadoraPage'));
const ImportPage = lazy(() => import('./pages/import/ImportPage').then(module => ({ default: module.ImportPage })));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage').then(module => ({ default: module.ReportsPage })));

// Wrapper para Suspense con loader personalizado
function SuspenseRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || <RouteLoader type="skeleton" />}>
      {children}
    </Suspense>
  );
}

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
        <Route path="/" element={
          <SuspenseRoute>
            <Dashboard />
          </SuspenseRoute>
        } />
        
        {/* Clientes routes */}
        <Route path="/clientes" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando clientes..." />}>
            <ClientesPage />
          </SuspenseRoute>
        } />
        <Route path="/clientes/new" element={
          <SuspenseRoute fallback={<RouteLoader type="minimal" message="Cargando formulario..." />}>
            <ClienteFormPage />
          </SuspenseRoute>
        } />
        <Route path="/clientes/:id" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando detalles del cliente..." />}>
            <ClienteDetailPage />
          </SuspenseRoute>
        } />
        <Route path="/clientes/:id/edit" element={
          <SuspenseRoute fallback={<RouteLoader type="minimal" message="Cargando formulario..." />}>
            <ClienteFormPage />
          </SuspenseRoute>
        } />
        <Route path="/clientes/:clienteId/sites" element={<Container><Text>Sites del Cliente - Coming Soon</Text></Container>} />
        <Route path="/clientes/:clienteId/tramos" element={<Container><Text>Tramos del Cliente - Coming Soon</Text></Container>} />
        
        {/* Empresas routes */}
        <Route path="/empresas" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando empresas..." />}>
            <EmpresasPage />
          </SuspenseRoute>
        } />
        <Route path="/empresas/:id" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando detalles de la empresa..." />}>
            <EmpresaDetailPage />
          </SuspenseRoute>
        } />
        <Route path="/empresas/:id/edit" element={<Container><Text>Empresa Edit - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/personal" element={<Container><Text>Personal de la Empresa - Coming Soon</Text></Container>} />
        <Route path="/empresas/:id/vehiculos" element={<Container><Text>Vehículos de la Empresa - Coming Soon</Text></Container>} />
        
        {/* Gestión de recursos */}
        <Route path="/personal" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando personal..." />}>
            <PersonalPage />
          </SuspenseRoute>
        } />
        <Route path="/sites" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando sitios..." />}>
            <SitesPage />
          </SuspenseRoute>
        } />
        <Route path="/tramos" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando tramos..." />}>
            <TramosPage />
          </SuspenseRoute>
        } />
        <Route path="/vehiculos" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando vehículos..." />}>
            <VehiculosPage />
          </SuspenseRoute>
        } />
        <Route path="/extras" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando extras..." />}>
            <ExtrasPage />
          </SuspenseRoute>
        } />
        
        {/* Operaciones críticas */}
        <Route path="/viajes" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando viajes..." />}>
            <ViajesPage />
          </SuspenseRoute>
        } />
        <Route path="/ordenes-compra" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando órdenes de compra..." />}>
            <OrdenesCompraPage />
          </SuspenseRoute>
        } />
        
        {/* Herramientas */}
        <Route path="/calculadora" element={
          <SuspenseRoute fallback={<RouteLoader type="minimal" message="Cargando calculadora..." />}>
            <CalculadoraPage />
          </SuspenseRoute>
        } />
        <Route path="/import" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando importador..." />}>
            <ImportPage />
          </SuspenseRoute>
        } />
        <Route path="/reports" element={
          <SuspenseRoute fallback={<RouteLoader message="Cargando reportes..." />}>
            <ReportsPage />
          </SuspenseRoute>
        } />
      </Route>
    </Routes>
  );
}