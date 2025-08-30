import React from 'react';
import { Paper, Group, Box, Text, Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

interface GenerationSectionProps {
  selectedCount: number;
  totalRecords: number;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const GenerationSection: React.FC<GenerationSectionProps> = ({
  selectedCount,
  totalRecords,
  isGenerating,
  onGenerate,
}) => {
  if (selectedCount === 0) return null;

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Box>
          <Text fw={500} size="sm">
            Generar Hojas de Referencia
          </Text>
          <Text size="xs" c="dimmed">
            {selectedCount} entidades seleccionadas • {totalRecords} registros totales
          </Text>
        </Box>

        <Button
          leftSection={<IconDownload size={16} />}
          onClick={onGenerate}
          loading={isGenerating}
          disabled={selectedCount === 0}
        >
          Generar y Descargar
        </Button>
      </Group>
    </Paper>
  );
};
