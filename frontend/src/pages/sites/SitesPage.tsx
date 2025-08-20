import React, { useState } from 'react';
import { Container, Group, SegmentedControl, Stack, Space } from '@mantine/core';
import { Site, SiteFilters } from '../../types';
import { useModal } from '../../hooks/useModal';
import { siteExcelService } from '../../services/BaseExcelService';
import { useSitesData } from './hooks/useSitesData';
import { useSitesActions } from './hooks/useSitesActions';
import { useSitesTable } from './hooks/useSitesTable';
import { useExcelOperations } from '../../hooks/useExcelOperations';
import { notifications } from '@mantine/notifications';
import { SitesHeader } from './components/SitesHeader';
import { SitesContent } from './components/SitesContent';
import { SitesModals } from './components/SitesModals';

type FilterValue = string | number | boolean | Date | null | undefined;

const SitesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [baseFilters, setBaseFilters] = useState<SiteFilters>({
    page: 1,
    limit: 10,
    search: '',
  });

  const deleteModal = useModal<Site>();
  const importModal = useModal();

  const { sites, loading, pagination, selectedSite, setSelectedSite, loadSites, getClienteNombre } =
    useSitesData(baseFilters);

  const excelOperations = useExcelOperations({
    entityType: 'sites',
    entityName: 'sites',
    exportFunction: (filters) => siteExcelService.exportToExcel(filters),
    templateFunction: () => siteExcelService.getTemplate(),
    reloadFunction: () => loadSites(),
  });

  const { handleDelete, handleImportComplete, openGoogleMaps } = useSitesActions(
    loadSites,
    deleteModal,
    excelOperations
  );

  const handleEdit = (_site: Site) => {
    notifications.show({
      title: 'Funcionalidad pendiente',
      message: 'La edición de sites estará disponible pronto',
      color: 'blue',
    });
  };

  const { columns } = useSitesTable({
    sites,
    getClienteNombre,
    onEdit: handleEdit,
    onDelete: (site) => deleteModal.open(site),
    onOpenMap: openGoogleMaps,
  });

  const handleFilterChange = (
    key: keyof Omit<SiteFilters, 'page' | 'limit'>,
    value: FilterValue
  ) => {
    setBaseFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setBaseFilters((prev) => ({ ...prev, page, limit: pageSize }));
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <SitesHeader
          loading={loading}
          onExport={() => excelOperations.handleExport()}
          onImport={() => importModal.open()}
        />

        <Group justify="flex-end">
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as 'list' | 'map')}
            data={[
              { label: 'Lista', value: 'list' },
              { label: 'Mapa', value: 'map' },
            ]}
          />
        </Group>

        <Space h="sm" />

        <SitesContent
          viewMode={viewMode}
          sites={sites}
          loading={loading}
          pagination={pagination}
          selectedSite={selectedSite}
          columns={columns}
          onPageChange={handlePageChange}
          onFiltersChange={handleFilterChange}
          onSiteSelect={setSelectedSite}
          onSiteEdit={handleEdit}
          setBaseFilters={setBaseFilters}
        />
      </Stack>

      <SitesModals
        deleteModal={deleteModal}
        importModal={importModal}
        onDelete={handleDelete}
        onImportComplete={handleImportComplete}
        onImportClose={() => {
          importModal.close();
        }}
      />
    </Container>
  );
};

export default SitesPage;
