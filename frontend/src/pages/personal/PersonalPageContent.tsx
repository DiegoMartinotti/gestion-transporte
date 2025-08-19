import React from 'react';
import { Container, Stack, Tabs, Alert } from '@mantine/core';
import { IconAlertTriangle, IconUser, IconLicense } from '@tabler/icons-react';
import PersonalStatistics from '../../components/personal/PersonalStatistics';
import { PersonalModals } from './PersonalModals';
import { PersonalListTab } from './PersonalListTab';
import { PersonalDocumentationTab } from './PersonalDocumentationTab';
import { PersonalPageHeader } from './PersonalPageHeader';
import type { Personal, PersonalFilters, Empresa } from '../../types';

interface PersonalStats {
  total: number;
  activos: number;
  inactivos: number;
  conductores: number;
  documentosVenciendo: number;
}

interface ModalState<T = Personal> {
  isOpen: boolean;
  selectedItem: T | null;
  openCreate: () => void;
  openEdit?: (item: T) => void;
  openView?: (item: T) => void;
  openDelete?: (item: T) => void;
  close: () => void;
}

interface ExcelOperations {
  handleExport: (filters: unknown) => void;
  isExporting: boolean;
  handleImportComplete: (result: unknown) => void;
}

interface TableColumn {
  key: string;
  label: string;
  render: (person: Personal) => React.ReactNode;
}

interface PersonalPageContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalItems: number;
  stats: PersonalStats;
  filters: Omit<PersonalFilters, 'page' | 'limit'>;
  empresas: Empresa[];
  personal: Personal[];
  columns: TableColumn[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  formModal: ModalState<Personal>;
  detailModal: ModalState<Personal>;
  deleteModal: ModalState<Personal>;
  importModal: ModalState;
  excelOperations: ExcelOperations;
  handleFilterChange: (key: string, value: unknown) => void;
  handlePageChange: (page: number) => void;
  handleCreatePersonal: () => void;
  handleEditPersonal: (person: Personal) => void;
  handleViewPersonal: (person: Personal) => void;
  handleFormSubmit: () => Promise<void>;
  handleImportComplete: (result: unknown) => Promise<void>;
  confirmDelete: () => Promise<void>;
  loadPersonal: () => Promise<void>;
  handleTemplateDownload: () => Promise<void>;
}

export const PersonalPageContent: React.FC<PersonalPageContentProps> = ({
  activeTab,
  setActiveTab,
  totalItems,
  stats,
  filters,
  empresas,
  personal,
  columns,
  loading,
  currentPage,
  totalPages,
  formModal,
  detailModal,
  deleteModal,
  importModal,
  excelOperations,
  handleFilterChange,
  handlePageChange,
  handleCreatePersonal,
  handleEditPersonal,
  handleViewPersonal,
  handleFormSubmit,
  handleImportComplete,
  confirmDelete,
  loadPersonal,
  handleTemplateDownload,
}) => {
  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <PersonalPageHeader
          totalItems={totalItems}
          filters={filters}
          importModal={importModal}
          excelOperations={excelOperations}
          onCreatePersonal={handleCreatePersonal}
        />

        {/* Statistics Cards */}
        <PersonalStatistics stats={stats} />

        {/* Alert for documents expiring */}
        {stats.documentosVenciendo > 0 && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Documentos por Vencer"
            color="yellow"
          >
            Hay {stats.documentosVenciendo} empleado{stats.documentosVenciendo > 1 ? 's' : ''} con
            documentos que vencen en los próximos 30 días. Revisa la pestaña
            &quot;Documentación&quot; para más detalles.
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'list')}>
          <Tabs.List>
            <Tabs.Tab value="list" leftSection={<IconUser size={16} />}>
              Lista de Personal
            </Tabs.Tab>
            <Tabs.Tab value="documentation" leftSection={<IconLicense size={16} />}>
              Documentación
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="list" pt="lg">
            <PersonalListTab
              filters={filters}
              empresas={empresas}
              personal={personal}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onFilterChange={handleFilterChange}
              onRefresh={loadPersonal}
              onPageChange={handlePageChange}
            />
          </Tabs.Panel>

          <Tabs.Panel value="documentation" pt="lg">
            <PersonalDocumentationTab
              personal={personal}
              onViewPersonal={handleViewPersonal}
              onEditPersonal={handleEditPersonal}
            />
          </Tabs.Panel>
        </Tabs>

        <PersonalModals
          formModal={formModal}
          detailModal={detailModal}
          deleteModal={deleteModal}
          importModal={importModal}
          onFormSubmit={handleFormSubmit}
          onConfirmDelete={confirmDelete}
          onImportComplete={handleImportComplete}
          onEditPersonal={handleEditPersonal}
          onTemplateDownload={handleTemplateDownload}
        />
      </Stack>
    </Container>
  );
};
