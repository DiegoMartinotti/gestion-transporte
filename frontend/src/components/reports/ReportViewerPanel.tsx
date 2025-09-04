import React, { Suspense } from 'react';
import { Stack, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReportDefinition, ReportData, ExportConfig } from '../../types/reports';
import { ExportOptions } from './ExportOptions';

const ReportViewer = React.lazy(() =>
  import('./ReportViewer').then((module) => ({
    default: module.ReportViewer,
  }))
);

interface ReportViewerPanelProps {
  selectedReport: ReportDefinition | null;
  reportData: ReportData | null;
  reportLoading: boolean;
  onExecuteReport: (definition: ReportDefinition) => void;
  onExport: (config: ExportConfig) => void;
}

export const ReportViewerPanel: React.FC<ReportViewerPanelProps> = ({
  selectedReport,
  reportData,
  reportLoading,
  onExecuteReport,
  onExport,
}) => {
  if (!selectedReport || !reportData) {
    return (
      <Alert color="blue" title="Seleccione un reporte">
        Ejecute un reporte desde el dashboard para visualizar los datos aquí.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Suspense
        fallback={
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Cargando visualizador de reportes...
          </div>
        }
      >
        <ReportViewer
          reportDefinition={selectedReport}
          data={reportData}
          loading={reportLoading}
          onRefresh={() => onExecuteReport(selectedReport)}
          onExport={onExport}
        />
      </Suspense>

      <ExportOptions
        reportDefinition={selectedReport}
        reportData={reportData}
        onExportComplete={(_, filename) => {
          notifications.show({
            title: 'Exportación completada',
            message: `Archivo ${filename} descargado correctamente`,
            color: 'green',
          });
        }}
      />
    </Stack>
  );
};
