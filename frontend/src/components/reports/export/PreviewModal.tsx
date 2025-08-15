import React from 'react';
import { Modal, Stack, Alert, Group, Button } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import type { ReportData } from '../../../types/reports';
import type { ExportState } from './types';
import { ExportPreview } from './ExportPreview';

interface PreviewModalProps {
  opened: boolean;
  onClose: () => void;
  exportState: ExportState;
  reportData: ReportData;
  onExport: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  opened,
  onClose,
  exportState,
  reportData,
  onExport,
}) => {
  const handleExportAndClose = () => {
    onClose();
    onExport();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Vista Previa de Exportación" size="md">
      <Stack gap="md">
        <ExportPreview exportState={exportState} reportData={reportData} />

        <Alert color="blue" icon={<IconEye size={16} />}>
          Esta es una vista previa de la configuración. El archivo final puede variar según el
          formato seleccionado.
        </Alert>

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleExportAndClose}>Exportar Ahora</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
