import React from 'react';
import { TramosHeader } from './TramosHeader';
import { TramosFiltersPanel } from './TramosFiltersPanel';
import { TramosTabs } from './TramosTabs';
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

      <TramosTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredTramos={filteredTramos}
        tramos={tramos}
        loading={loading}
        detailModal={detailModal}
        formModal={formModal}
        deleteModal={deleteModal}
        onCalculationChange={onCalculationChange}
      />
    </>
  );
};
