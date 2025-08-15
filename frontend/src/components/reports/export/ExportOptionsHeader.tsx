import React from 'react';
import { Title, Group, Button, Text } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';

interface ExportOptionsHeaderProps {
  reportName: string;
  onOpenPreview: () => void;
}

export const ExportOptionsHeader: React.FC<ExportOptionsHeaderProps> = ({
  reportName,
  onOpenPreview,
}) => {
  return (
    <Group justify="space-between">
      <div>
        <Title order={3}>Opciones de Exportación</Title>
        <Text c="dimmed" size="sm">
          Configure las opciones para exportar el reporte &quot;{reportName}&quot;
        </Text>
      </div>

      <Button leftSection={<IconEye size={16} />} variant="light" onClick={onOpenPreview}>
        Vista Previa
      </Button>
    </Group>
  );
};
