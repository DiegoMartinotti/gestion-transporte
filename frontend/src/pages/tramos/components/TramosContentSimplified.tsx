import React from 'react';
import { Tabs, Badge, Group, ActionIcon } from '@mantine/core';
import { IconFilter, IconDots } from '@tabler/icons-react';
import { TramosHeader } from './TramosHeader';
import { TramosFiltersPanel } from './TramosFiltersPanel';
import { TramosDataView } from './TramosDataView';
import { TramosCalculatorTab } from './TramosCalculatorTab';
import { Tramo, Cliente } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';
import { TarifaCalculationResult } from '../types';

interface LocalSite {
  _id: string;
  nombre: string;
  cliente: string;
}

interface TramosStats {
  total: number;
  conTarifa: number;
  sinTarifa: number;
}

interface TramosContentProps {
  // Estados
  viewMode: 'list' | 'cards';
  setViewMode: (mode: 'list' | 'cards') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;

  // Datos
  tramos: Tramo[];
  clientes: Cliente[];
  sites: LocalSite[];
  filteredTramos: Tramo[];
  stats: TramosStats;

  // Filtros
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCliente: string;
  setSelectedCliente: (cliente: string) => void;
  selectedOrigen: string;
  setSelectedOrigen: (origen: string) => void;
  selectedDestino: string;
  setSelectedDestino: (destino: string) => void;
  clearFilters: () => void;

  // Modales
  formModal: ModalReturn<Tramo>;
  deleteModal: ModalReturn<Tramo>;
  detailModal: ModalReturn<Tramo>;
  importModal: ModalReturn;

  // Operaciones
  loadData: () => Promise<void>;
  onCalculationChange: (result: TarifaCalculationResult) => void;
  onExport: () => void;
  onGetTemplate: () => void;
}

export const TramosContent: React.FC<TramosContentProps> = ({
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  loading,
  tramos,
  clientes,
  sites,
  filteredTramos,
  stats,
  searchTerm,
  setSearchTerm,
  selectedCliente,
  setSelectedCliente,
  selectedOrigen,
  setSelectedOrigen,
  selectedDestino,
  setSelectedDestino,
  clearFilters,
  formModal,
  deleteModal,
  detailModal,
  importModal,
  loadData,
  onCalculationChange,
  onExport,
  onGetTemplate,
}) => {
  return (
    <>
      <TramosHeader
        stats={stats}
        importModal={importModal}
        onExport={onExport}
        onGetTemplate={onGetTemplate}
        onRefresh={loadData}
        onNewTramo={formModal.openCreate}
      />

      <TramosFiltersPanel
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        selectedOrigen={selectedOrigen}
        setSelectedOrigen={setSelectedOrigen}
        selectedDestino={selectedDestino}
        setSelectedDestino={setSelectedDestino}
        clearFilters={clearFilters}
        clientes={clientes}
        sites={sites}
      />

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'todos')}>
        <Group justify="space-between" mb="md">
          <Tabs.List>
            <Tabs.Tab value="todos">
              Todos{' '}
              <Badge size="xs" ml="xs">
                {stats.total}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="con-tarifa">
              Con Tarifa{' '}
              <Badge size="xs" ml="xs">
                {stats.conTarifa}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="sin-tarifa">
              Sin Tarifa{' '}
              <Badge size="xs" ml="xs">
                {stats.sinTarifa}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="calculadora">Calculadora</Tabs.Tab>
          </Tabs.List>

          <Group>
            <ActionIcon.Group>
              <ActionIcon
                variant={viewMode === 'list' ? 'filled' : 'light'}
                onClick={() => setViewMode('list')}
              >
                <IconFilter size={16} />
              </ActionIcon>
              <ActionIcon
                variant={viewMode === 'cards' ? 'filled' : 'light'}
                onClick={() => setViewMode('cards')}
              >
                <IconDots size={16} />
              </ActionIcon>
            </ActionIcon.Group>
          </Group>
        </Group>

        <Tabs.Panel value="todos">
          <TramosDataView
            tramos={filteredTramos}
            viewMode={viewMode}
            loading={loading}
            detailModal={detailModal}
            formModal={formModal}
            deleteModal={deleteModal}
          />
        </Tabs.Panel>

        <Tabs.Panel value="con-tarifa">
          <TramosDataView
            tramos={filteredTramos}
            viewMode={viewMode}
            loading={loading}
            detailModal={detailModal}
            formModal={formModal}
            deleteModal={deleteModal}
          />
        </Tabs.Panel>

        <Tabs.Panel value="sin-tarifa">
          <TramosDataView
            tramos={filteredTramos}
            viewMode={viewMode}
            loading={loading}
            detailModal={detailModal}
            formModal={formModal}
            deleteModal={deleteModal}
          />
        </Tabs.Panel>

        <Tabs.Panel value="calculadora">
          <TramosCalculatorTab
            tramos={tramos}
            formModal={formModal}
            onCalculationChange={onCalculationChange}
          />
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
