import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/clientes/ClientesPage';
import ClienteDetailPage from './pages/clientes/ClienteDetailPage';
import EmpresasPage from './pages/empresas/EmpresasPage';
import EmpresaDetailPage from './pages/empresas/EmpresaDetailPage';
import { PersonalPage } from './pages/personal/PersonalPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        {/* Clientes routes */}
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        <Route path="/clientes/:id/edit" element={<div>Cliente Edit - Coming Soon</div>} />
        <Route path="/clientes/:id/sites" element={<div>Cliente Sites - Coming Soon</div>} />
        <Route path="/clientes/:id/tramos" element={<div>Cliente Tramos - Coming Soon</div>} />
        
        {/* Empresas routes */}
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/empresas/:id" element={<EmpresaDetailPage />} />
        <Route path="/empresas/:id/edit" element={<div>Empresa Edit - Coming Soon</div>} />
        <Route path="/empresas/:id/personal" element={<div>Empresa Personal - Coming Soon</div>} />
        <Route path="/empresas/:id/vehiculos" element={<div>Empresa Vehiculos - Coming Soon</div>} />
        
        {/* Other routes */}
        <Route path="/personal" element={<PersonalPage />} />
        <Route path="/sites" element={<div>Sites - Coming Soon</div>} />
        <Route path="/tramos" element={<div>Tramos - Coming Soon</div>} />
        <Route path="/vehiculos" element={<div>Vehículos - Coming Soon</div>} />
        <Route path="/viajes" element={<div>Viajes - Coming Soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}