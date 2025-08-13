import React from 'react';
import { Tabs } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { VehiculosFilters } from './VehiculosFilters';
import { VehiculosTable } from './VehiculosTable';
import { VehiculosVencimientosPanel } from './VehiculosVencimientosPanel';
import { Vehiculo } from '../../types/vehiculo';
import { Empresa } from '../../types';

interface VehiculosTabsProps {
  activeTab: string | null;
  handleTabChange: (value: string | null) => void;
  vehiculos: Vehiculo[];
  vehiculosVencimientos: any[];
  filters: any;
  handleFiltersChange: (filters: any) => void;
  empresas: Empresa[];
  viewMode: 'list' | 'cards';
  setViewMode: (mode: 'list' | 'cards') => void;
  vehiculosColumns: any[];
  vencimientosColumns: any[];
  loading: boolean;
  formModal: any;
  openDeleteModal: (id: string, dominio?: string) => void;
  detailModal: any;
}

export const VehiculosTabs: React.FC<VehiculosTabsProps> = ({
  activeTab,
  handleTabChange,
  vehiculos,
  vehiculosVencimientos,
  filters,
  handleFiltersChange,
  empresas,
  viewMode,
  setViewMode,
  vehiculosColumns,
  vencimientosColumns,
  loading,
  formModal,
  openDeleteModal,
  detailModal,
}) => {
  return (
    <Tabs value={activeTab} onChange={handleTabChange} mb="md">
      <Tabs.List>
        <Tabs.Tab value="todos">Todos los Vehículos ({vehiculos?.length || 0})</Tabs.Tab>
        <Tabs.Tab value="vencimientos" leftSection={<IconAlertTriangle size={16} />} color="orange">
          Vencimientos Próximos ({vehiculosVencimientos?.length || 0})
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="todos">
        <VehiculosFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          empresas={empresas}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <VehiculosTable
          vehiculos={vehiculos}
          columns={vehiculosColumns}
          loading={loading}
          viewMode={viewMode}
          onEdit={formModal.openEdit}
          onDelete={openDeleteModal}
          onView={detailModal.openView}
        />
      </Tabs.Panel>

      <Tabs.Panel value="vencimientos">
        <VehiculosVencimientosPanel
          vehiculos={vehiculos}
          vehiculosVencimientos={vehiculosVencimientos}
          vencimientosColumns={vencimientosColumns}
          loading={loading}
          formModal={formModal}
        />
      </Tabs.Panel>
    </Tabs>
  );
};

export default VehiculosTabs;
