import React from 'react';
import { Stack, Container, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileText, IconSettings, IconPalette } from '@tabler/icons-react';
import { ReportData, ReportDefinition } from '../../types/reports';
import { FormatSelector } from './export/FormatSelector';
import { ContentOptionsPanel } from './export/ContentOptionsPanel';
import { StyleOptionsPanel } from './export/StyleOptionsPanel';
import { ExportPreview } from './export/ExportPreview';
import { PreviewModal } from './export/PreviewModal';
import { AdvancedOptionsModal } from './export/AdvancedOptionsModal';
import { ExportProgressCard } from './export/ExportProgressCard';
import { ExportOptionsHeader } from './export/ExportOptionsHeader';
import { ExportControlsFooter } from './export/ExportControlsFooter';
import { useExportState } from './export/useExportState';
import { useExportHandlers } from './export/useExportHandlers';

interface ExportOptionsProps {
  reportDefinition: ReportDefinition;
  reportData: ReportData;
  onExportComplete?: (blob: Blob, filename: string) => void;
  onExportStart?: () => void;
  onExportError?: (error: string) => void;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  reportDefinition,
  reportData,
  onExportComplete,
  onExportStart,
  onExportError,
}) => {
  const { exportState, updateExportState, updateFileName } = useExportState(reportDefinition);
  const { handleExport, validateConfig } = useExportHandlers({
    exportState,
    updateExportState,
    reportData,
    onExportComplete,
    onExportStart,
    onExportError,
  });

  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] =
    useDisclosure(false);
  const [advancedModalOpened, { open: openAdvancedModal, close: closeAdvancedModal }] =
    useDisclosure(false);

  return (
    <Container size="md">
      <Stack gap="xl">
        <ExportOptionsHeader reportName={reportDefinition.name} onOpenPreview={openPreviewModal} />

        <Tabs defaultValue="format">
          <Tabs.List>
            <Tabs.Tab value="format" leftSection={<IconFileText size={16} />}>
              Formato
            </Tabs.Tab>
            <Tabs.Tab value="content" leftSection={<IconSettings size={16} />}>
              Contenido
            </Tabs.Tab>
            <Tabs.Tab value="style" leftSection={<IconPalette size={16} />}>
              Presentación
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="format" pt="md">
            <FormatSelector
              selectedFormat={exportState.format}
              onFormatChange={(format) => {
                updateExportState({ format });
                updateFileName();
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="content" pt="md">
            <ContentOptionsPanel
              exportState={exportState}
              reportDefinition={reportDefinition}
              onUpdate={updateExportState}
              onRefreshFileName={updateFileName}
            />
          </Tabs.Panel>

          <Tabs.Panel value="style" pt="md">
            <StyleOptionsPanel exportState={exportState} onUpdate={updateExportState} />
          </Tabs.Panel>
        </Tabs>

        <ExportPreview exportState={exportState} reportData={reportData} />

        {exportState.isExporting && <ExportProgressCard progress={exportState.progress} />}

        <ExportControlsFooter
          totalRows={reportData.totalRows}
          isExporting={exportState.isExporting}
          isDisabled={!!validateConfig()}
          onOpenAdvanced={openAdvancedModal}
          onExport={handleExport}
        />
      </Stack>

      <PreviewModal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        exportState={exportState}
        reportData={reportData}
        onExport={handleExport}
      />

      <AdvancedOptionsModal
        opened={advancedModalOpened}
        onClose={closeAdvancedModal}
        exportState={exportState}
        onUpdate={updateExportState}
      />
    </Container>
  );
};
