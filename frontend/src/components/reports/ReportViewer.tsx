import React, { useState } from 'react';
import { Title, Group, Button, Stack, Card, Text, Badge, Loader, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTable, IconDownload, IconRefresh, IconChartBar } from '@tabler/icons-react';
import { ReportData, ReportDefinition, ExportConfig } from '../../types/reports';
import { TableView, ChartViewContainer } from './ReportViewerViews';
import { ReportActionsMenu, FullscreenModal } from './ReportViewerComponents';
import { useReportViewerTable } from './hooks/useReportViewerTable';
import { useReportViewerCharts } from './hooks/useReportViewerCharts';

interface ReportViewerProps {
  reportDefinition: ReportDefinition;
  data: ReportData;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (config: ExportConfig) => void;
}

const ReportHeader: React.FC<{
  reportDefinition: ReportDefinition;
  data: ReportData;
  loading: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen: () => void;
}> = ({ reportDefinition, data, loading, onRefresh, onExport, onFullscreen }) => (
  <Group justify="space-between" align="flex-start">
    <div>
      <Title order={2}>{reportDefinition.name}</Title>
      {reportDefinition.description && (
        <Text size="sm" c="dimmed" mt="xs">
          {reportDefinition.description}
        </Text>
      )}
      <Group gap="xs" mt="sm">
        <Badge variant="light" color="blue">
          {data.rows.length} registros
        </Badge>
        <Badge variant="light" color="gray">
          {data.headers.length} campos
        </Badge>
      </Group>
    </div>

    <Group>
      {onRefresh && (
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={onRefresh}
          loading={loading}
        >
          Actualizar
        </Button>
      )}
      {onExport && (
        <Button variant="outline" leftSection={<IconDownload size={16} />} onClick={onExport}>
          Exportar
        </Button>
      )}
      <ReportActionsMenu onExport={onExport} onFullscreen={onFullscreen} />
    </Group>
  </Group>
);

const ReportTabs: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reportDefinition: ReportDefinition;
  data: ReportData;
  tableState: ReturnType<typeof useReportViewerTable>['tableState'];
  processedTableData: ReturnType<typeof useReportViewerTable>['processedTableData'];
  handleSort: ReturnType<typeof useReportViewerTable>['handleSort'];
  handleSearch: ReturnType<typeof useReportViewerTable>['handleSearch'];
  handlePageChange: ReturnType<typeof useReportViewerTable>['handlePageChange'];
  handlePageSizeChange: ReturnType<typeof useReportViewerTable>['handlePageSizeChange'];
  processedChartData: ReturnType<typeof useReportViewerCharts>['processedChartData'];
  selectedChart: number;
  setSelectedChart: (chart: number) => void;
  onRefresh?: () => void;
  loading: boolean;
}> = ({
  activeTab,
  setActiveTab,
  reportDefinition,
  data,
  tableState,
  processedTableData,
  handleSort,
  handleSearch,
  handlePageChange,
  handlePageSizeChange,
  processedChartData,
  selectedChart,
  setSelectedChart,
  onRefresh,
  loading,
}) => (
  <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'table')}>
    <Tabs.List>
      <Tabs.Tab value="table" leftSection={<IconTable size={16} />}>
        Tabla
      </Tabs.Tab>
      {reportDefinition.charts && reportDefinition.charts.length > 0 && (
        <Tabs.Tab value="charts" leftSection={<IconChartBar size={16} />}>
          Gráficos
        </Tabs.Tab>
      )}
    </Tabs.List>

    <Tabs.Panel value="table" pt="md">
      <TableView
        tableState={tableState}
        processedTableData={processedTableData}
        data={data}
        onSearch={handleSearch}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onRefresh={onRefresh}
        loading={loading}
      />
    </Tabs.Panel>

    {reportDefinition.charts && reportDefinition.charts.length > 0 && (
      <Tabs.Panel value="charts" pt="md">
        <ChartViewContainer
          reportDefinition={reportDefinition}
          chartData={processedChartData}
          selectedChart={selectedChart}
          onChartChange={setSelectedChart}
        />
      </Tabs.Panel>
    )}
  </Tabs>
);

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportDefinition,
  data,
  loading = false,
  onRefresh,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState('table');
  const [fullscreenModalOpened, { open: openFullscreenModal, close: closeFullscreenModal }] =
    useDisclosure(false);

  const {
    tableState,
    processedTableData,
    handleSort,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useReportViewerTable(data);

  const { selectedChart, setSelectedChart, processedChartData } = useReportViewerCharts(data);

  const handleExport = () => {
    onExport?.({
      format: 'excel',
      includeHeaders: true,
      filename: `${reportDefinition.name}_${new Date().toISOString().split('T')[0]}`,
    });
  };

  if (loading && !data) {
    return (
      <Card>
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text>Cargando datos del reporte...</Text>
        </Stack>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <Text c="dimmed" ta="center" py="xl">
          No hay datos disponibles para mostrar
        </Text>
      </Card>
    );
  }

  const currentContent = (
    <Stack gap="md">
      <ReportHeader
        reportDefinition={reportDefinition}
        data={data}
        loading={loading}
        onRefresh={onRefresh}
        onExport={onExport ? handleExport : undefined}
        onFullscreen={openFullscreenModal}
      />
      <ReportTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reportDefinition={reportDefinition}
        data={data}
        tableState={tableState}
        processedTableData={processedTableData}
        handleSort={handleSort}
        handleSearch={handleSearch}
        handlePageChange={handlePageChange}
        handlePageSizeChange={handlePageSizeChange}
        processedChartData={processedChartData}
        selectedChart={selectedChart}
        setSelectedChart={setSelectedChart}
        onRefresh={onRefresh}
        loading={loading}
      />
    </Stack>
  );

  return (
    <>
      {currentContent}

      <FullscreenModal
        opened={fullscreenModalOpened}
        onClose={closeFullscreenModal}
        title={reportDefinition.name}
      >
        {currentContent}
      </FullscreenModal>
    </>
  );
};
