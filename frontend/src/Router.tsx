import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/clientes/ClientesPage';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<ClientesPage />} />
        {/* TODO: Add more routes as components are created */}
        <Route path="/empresas" element={<div>Empresas - Coming Soon</div>} />
        <Route path="/personal" element={<div>Personal - Coming Soon</div>} />
        <Route path="/sites" element={<div>Sites - Coming Soon</div>} />
        <Route path="/tramos" element={<div>Tramos - Coming Soon</div>} />
        <Route path="/vehiculos" element={<div>Vehículos - Coming Soon</div>} />
        <Route path="/viajes" element={<div>Viajes - Coming Soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}