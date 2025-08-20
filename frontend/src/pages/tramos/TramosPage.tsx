import React from 'react';
import { Container } from '@mantine/core';
import { useTramosPage } from './hooks/useTramosPage';
import { TramosContent } from './components/TramosContentSimplified';
import { TramosModals } from './components/TramosModals';
import { TarifaCalculationResult } from './types';

const TramosPage: React.FC = () => {
  const {
    // Estados
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    loading,

    // Datos
    tramos,
    clientes,
    sites,
    filteredTramos,
    stats,

    // Filtros
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedOrigen,
    setSelectedOrigen,
    selectedDestino,
    setSelectedDestino,
    clearFilters,

    // Modales
    formModal,
    deleteModal,
    detailModal,
    importModal,

    // Operaciones
    loadData,
    handleFormSubmit,
    confirmDelete,
    handleImportComplete,
    excelOperations,
  } = useTramosPage();

  const handleCalculationChange = (result: TarifaCalculationResult) => {
    console.log('Resultado cálculo:', result);
  };

  return (
    <Container fluid>
      <TramosContent
        // Estados
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loading={loading}
        // Datos
        tramos={tramos}
        clientes={clientes}
        sites={sites}
        filteredTramos={filteredTramos}
        stats={stats}
        // Filtros
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        selectedOrigen={selectedOrigen}
        setSelectedOrigen={setSelectedOrigen}
        selectedDestino={selectedDestino}
        setSelectedDestino={setSelectedDestino}
        clearFilters={clearFilters}
        // Modales
        formModal={formModal}
        deleteModal={deleteModal}
        detailModal={detailModal}
        importModal={importModal}
        // Operaciones
        loadData={loadData}
        onCalculationChange={handleCalculationChange}
        onExport={excelOperations.handleExport}
        onGetTemplate={excelOperations.handleGetTemplate}
      />

      <TramosModals
        formModal={formModal}
        deleteModal={deleteModal}
        detailModal={detailModal}
        importModal={importModal}
        clientes={clientes}
        sites={sites}
        onFormSubmit={handleFormSubmit}
        onConfirmDelete={confirmDelete}
        onImportComplete={handleImportComplete}
        _onCalculationChange={handleCalculationChange}
      />
    </Container>
  );
};

export default TramosPage;
