import React, { useState } from 'react';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { usePersonalStats } from '../../hooks/usePersonalStats';
import { personalExcelService } from '../../services/BaseExcelService';
import { createPersonalTableColumns, handleTemplateDownload } from './PersonalHelpers';
import { usePersonalData, usePersonalModals } from './PersonalHooks';
import { createEventHandlers } from './PersonalEventHandlers';
import { PersonalPageContent } from './PersonalPageContent';

export const PersonalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('list');

  // Usar custom hooks para reducir complejidad
  const {
    filters,
    setFilters,
    personalLoader,
    personal,
    empresas,
    loading,
    currentPage,
    totalPages,
    totalItems,
  } = usePersonalData();

  // Función de recarga
  const loadPersonal = async () => {
    await personalLoader.refresh();
  };

  // Usar custom hook para modales
  const { formModal, detailModal, deleteModal, importModal } = usePersonalModals(loadPersonal);

  // Hook unificado para operaciones Excel
  const excelOperations = useExcelOperations({
    entityType: 'personal',
    entityName: 'personal',
    exportFunction: (filters) => personalExcelService.exportToExcel(filters),
    templateFunction: () => personalExcelService.getTemplate(),
    reloadFunction: loadPersonal,
  });

  // Event handlers
  const {
    handleFilterChange,
    handlePageChange,
    handleCreatePersonal,
    handleEditPersonal,
    handleViewPersonal,
    handleDeletePersonal,
    confirmDelete,
    handleFormSubmit,
    handleImportComplete,
  } = createEventHandlers({
    setFilters,
    personalLoader,
    formModal,
    detailModal,
    deleteModal,
    importModal,
    loadPersonal,
    excelOperations,
  });

  // Get statistics using hook
  const stats = usePersonalStats(personal);

  // Table columns for DataTable
  const columns = createPersonalTableColumns(
    handleViewPersonal,
    handleEditPersonal,
    handleDeletePersonal
  );

  return (
    <PersonalPageContent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      totalItems={totalItems}
      stats={stats}
      filters={filters}
      empresas={empresas}
      personal={personal}
      columns={columns}
      loading={loading}
      currentPage={currentPage}
      totalPages={totalPages}
      formModal={formModal}
      detailModal={detailModal}
      deleteModal={deleteModal}
      importModal={importModal}
      excelOperations={excelOperations}
      handleFilterChange={handleFilterChange}
      handlePageChange={handlePageChange}
      handleCreatePersonal={handleCreatePersonal}
      handleEditPersonal={handleEditPersonal}
      handleViewPersonal={handleViewPersonal}
      handleDeletePersonal={handleDeletePersonal}
      handleFormSubmit={handleFormSubmit}
      handleImportComplete={handleImportComplete}
      confirmDelete={confirmDelete}
      loadPersonal={loadPersonal}
      handleTemplateDownload={handleTemplateDownload}
    />
  );
};
