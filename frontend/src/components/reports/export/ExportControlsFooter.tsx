import React from 'react';
import { Group, Button, Text } from '@mantine/core';
import { IconDownload, IconSettings } from '@tabler/icons-react';

interface ExportControlsFooterProps {
  totalRows: number;
  isExporting: boolean;
  isDisabled: boolean;
  onOpenAdvanced: () => void;
  onExport: () => void;
}

export const ExportControlsFooter: React.FC<ExportControlsFooterProps> = ({
  totalRows,
  isExporting,
  isDisabled,
  onOpenAdvanced,
  onExport,
}) => {
  return (
    <Group justify="space-between">
      <Group>
        <Text size="sm" c="dimmed">
          Tamaño estimado: ~{Math.round(totalRows * 0.1)}KB
        </Text>
      </Group>

      <Group>
        <Button variant="light" onClick={onOpenAdvanced} leftSection={<IconSettings size={16} />}>
          Opciones Avanzadas
        </Button>

        <Button
          leftSection={<IconDownload size={16} />}
          onClick={onExport}
          loading={isExporting}
          disabled={isDisabled}
        >
          Exportar
        </Button>
      </Group>
    </Group>
  );
};
