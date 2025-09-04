import React, { Suspense } from 'react';
import { Tabs, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ReportDefinition,
  ReportTemplate,
  ReportExecution,
  ReportData,
  ExportConfig,
} from '../../types/reports';
import { ReportSummaryCards } from './ReportSummaryCards';
import { ReportsList } from './ReportsList';
import { ReportViewerPanel } from './ReportViewerPanel';
import { TemplatesModal } from './TemplatesModal';
import { ScheduledReports } from './ScheduledReports';
import { ReportHistory } from './ReportHistory';

// Lazy load de componentes complejos
const ReportBuilder = React.lazy(() =>
  import('./ReportBuilder').then((module) => ({
    default: module.ReportBuilder,
  }))
);

interface ReportTabPanelsProps {
  reportDefinitions: ReportDefinition[];
  templates: ReportTemplate[];
  selectedReport: ReportDefinition | null;
  reportData: ReportData | null;
  loading: boolean;
  reportLoading: boolean;
  templatesModalOpened: boolean;
  onRefreshReports: () => void;
  onExecuteReport: (definition: ReportDefinition) => void;
  onEditReport: (definition: ReportDefinition) => void;
  onDeleteReport: (definition: ReportDefinition) => void;
  onReportSaved: (report: ReportDefinition) => void;
  onUseTemplate: (template: ReportTemplate) => void;
  onCloseTemplatesModal: () => void;
  onExport: (config: ExportConfig) => void;
}

export const ReportTabPanels: React.FC<ReportTabPanelsProps> = ({
  reportDefinitions,
  templates,
  selectedReport,
  reportData,
  loading,
  reportLoading,
  templatesModalOpened,
  onRefreshReports,
  onExecuteReport,
  onEditReport,
  onDeleteReport,
  onReportSaved,
  onUseTemplate,
  onCloseTemplatesModal,
  onExport,
}) => (
  <>
    {/* Dashboard Tab */}
    <Tabs.Panel value="dashboard" pt="md">
      <Stack gap="lg">
        <ReportSummaryCards reportDefinitions={reportDefinitions} templates={templates} />
        <ReportsList
          reportDefinitions={reportDefinitions}
          loading={loading}
          reportLoading={reportLoading}
          selectedReportId={selectedReport?.id}
          onRefresh={onRefreshReports}
          onExecuteReport={onExecuteReport}
          onEditReport={onEditReport}
          onDeleteReport={onDeleteReport}
        />
      </Stack>
    </Tabs.Panel>

    {/* Builder Tab */}
    <Tabs.Panel value="builder" pt="md">
      <Suspense
        fallback={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Cargando constructor de reportes...
          </div>
        }
      >
        <ReportBuilder reportId={selectedReport?.id} onSave={onReportSaved} />
      </Suspense>
    </Tabs.Panel>

    {/* Viewer Tab */}
    <Tabs.Panel value="viewer" pt="md">
      <ReportViewerPanel
        selectedReport={selectedReport}
        reportData={reportData}
        reportLoading={reportLoading}
        onExecuteReport={onExecuteReport}
        onExport={onExport}
      />
    </Tabs.Panel>

    {/* Scheduled Tab */}
    <Tabs.Panel value="scheduled" pt="md">
      <ScheduledReports
        reportDefinitions={reportDefinitions}
        onScheduleCreate={(schedule) => {
          notifications.show({
            title: 'Programación creada',
            message: `Reporte "${schedule.name}" programado correctamente`,
            color: 'green',
          });
        }}
      />
    </Tabs.Panel>

    {/* History Tab */}
    <Tabs.Panel value="history" pt="md">
      <ReportHistory
        reportDefinitions={reportDefinitions}
        onReportDownload={(execution: ReportExecution) => {
          notifications.show({
            title: 'Descarga iniciada',
            message: `Descargando reporte: ${execution.reportDefinitionId}`,
            color: 'blue',
          });
        }}
      />
    </Tabs.Panel>

    <TemplatesModal
      opened={templatesModalOpened}
      onClose={onCloseTemplatesModal}
      templates={templates}
      onUseTemplate={onUseTemplate}
    />
  </>
);
