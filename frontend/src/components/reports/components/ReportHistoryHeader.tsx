import React from 'react';
import { Title, Group, Button, Text } from '@mantine/core';
import { IconHistory, IconDownload, IconTrash } from '@tabler/icons-react';

interface ReportHistoryHeaderProps {
  selectedExecutionsSize: number;
  completedSelectedCount: number;
  onBulkDownload: () => void;
  onDeleteSelected: () => void;
}

export const ReportHistoryHeader: React.FC<ReportHistoryHeaderProps> = ({
  selectedExecutionsSize,
  completedSelectedCount,
  onBulkDownload,
  onDeleteSelected,
}) => (
  <Group justify="space-between" align="flex-start">
    <div>
      <Title order={2}>
        <Group gap="xs">
          <IconHistory size={28} />
          Historial de Reportes
        </Group>
      </Title>
      <Text size="sm" c="dimmed" mt="xs">
        Gestiona y descarga reportes ejecutados previamente
      </Text>
    </div>

    {selectedExecutionsSize > 0 && (
      <Group>
        {completedSelectedCount > 0 && (
          <Button
            variant="outline"
            leftSection={<IconDownload size={16} />}
            onClick={onBulkDownload}
          >
            Descargar ({completedSelectedCount})
          </Button>
        )}
        <Button
          color="red"
          variant="light"
          leftSection={<IconTrash size={16} />}
          onClick={onDeleteSelected}
        >
          Eliminar ({selectedExecutionsSize})
        </Button>
      </Group>
    )}
  </Group>
);
