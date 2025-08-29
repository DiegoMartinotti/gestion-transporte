import React from 'react';
import { Title, Group, Button, Text } from '@mantine/core';
import { IconEye, IconDeviceFloppy } from '@tabler/icons-react';

interface ReportBuilderHeaderProps {
  reportId?: string;
  loading: boolean;
  onPreview: () => void;
  onSave: () => void;
}

export const ReportBuilderHeader: React.FC<ReportBuilderHeaderProps> = ({
  reportId,
  loading,
  onPreview,
  onSave,
}) => (
  <Group justify="space-between" mb="xl">
    <div>
      <Title order={2}>{reportId ? 'Editar Reporte' : 'Crear Nuevo Reporte'}</Title>
      <Text size="sm" c="dimmed" mt="xs">
        {reportId
          ? 'Modifique la configuración del reporte existente'
          : 'Configure los parámetros para su nuevo reporte personalizado'}
      </Text>
    </div>
    <Group>
      <Button
        variant="outline"
        leftSection={<IconEye size={16} />}
        onClick={onPreview}
        disabled={loading}
      >
        Previsualizar
      </Button>
      <Button leftSection={<IconDeviceFloppy size={16} />} onClick={onSave} loading={loading}>
        {reportId ? 'Actualizar' : 'Guardar'}
      </Button>
    </Group>
  </Group>
);
