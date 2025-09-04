import React, { useState, useEffect } from 'react';
import { Container, Title, Tabs, Group, Button } from '@mantine/core';
import {
  IconReportAnalytics,
  IconPlus,
  IconTemplate,
  IconClock,
  IconHistory,
  IconEye,
  IconSettings,
} from '@tabler/icons-react';
import { useReportManagement } from '../../hooks/useReportManagement';
import { useTemplateManagement } from '../../hooks/useTemplateManagement';
import { useReportExecution } from '../../hooks/useReportExecution';
import { useReportsPageHandlers } from '../../hooks/useReportsPageHandlers';
import { ReportTabPanels } from '../../components/reports/ReportTabPanels';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Hooks personalizados
  const {
    reportDefinitions,
    loading,
    loadReportDefinitions,
    handleDeleteReport,
    handleReportSaved,
  } = useReportManagement();

  const {
    templates,
    templatesModalOpened,
    openTemplatesModal,
    closeTemplatesModal,
    loadTemplates,
    handleUseTemplate,
  } = useTemplateManagement();

  const {
    selectedReport,
    reportData,
    reportLoading,
    handleExecuteReport,
    handleEditReport,
    handleExport,
    setSelectedReport,
  } = useReportExecution();

  const { handleCreateNew, onReportSaved, onExecuteReport, onEditReport, onUseTemplate } =
    useReportsPageHandlers({
      setSelectedReport,
      setActiveTab,
      handleExecuteReport,
      handleEditReport,
      handleReportSaved,
      handleUseTemplate,
      loadReportDefinitions,
    });

  useEffect(() => {
    loadReportDefinitions();
    loadTemplates();
  }, [loadReportDefinitions, loadTemplates]);

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <Group gap="xs">
          <IconReportAnalytics size={28} />
          <Title order={2}>Sistema de Reportes</Title>
        </Group>
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconTemplate size={16} />}
            onClick={openTemplatesModal}
          >
            Plantillas
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreateNew}>
            Nuevo Reporte
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'dashboard')}>
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<IconReportAnalytics size={16} />}>
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab value="builder" leftSection={<IconSettings size={16} />}>
            Constructor
          </Tabs.Tab>
          <Tabs.Tab value="viewer" leftSection={<IconEye size={16} />}>
            Visualizador
          </Tabs.Tab>
          <Tabs.Tab value="scheduled" leftSection={<IconClock size={16} />}>
            Programados
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Historial
          </Tabs.Tab>
        </Tabs.List>

        <ReportTabPanels
          reportDefinitions={reportDefinitions}
          templates={templates}
          selectedReport={selectedReport}
          reportData={reportData}
          loading={loading}
          reportLoading={reportLoading}
          templatesModalOpened={templatesModalOpened}
          onRefreshReports={loadReportDefinitions}
          onExecuteReport={onExecuteReport}
          onEditReport={onEditReport}
          onDeleteReport={handleDeleteReport}
          onReportSaved={onReportSaved}
          onUseTemplate={onUseTemplate}
          onCloseTemplatesModal={closeTemplatesModal}
          onExport={handleExport}
        />
      </Tabs>
    </Container>
  );
};
