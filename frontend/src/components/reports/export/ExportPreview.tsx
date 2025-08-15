import React from 'react';
import { Card, Stack, Group, Text, Badge, Divider, Code } from '@mantine/core';
import type { ReportData } from '../../../types/reports';
import type { ExportState } from './types';
import { FORMAT_OPTIONS } from './constants';

interface ExportPreviewProps {
  exportState: ExportState;
  reportData: ReportData;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({ exportState, reportData }) => {
  const formatOption = FORMAT_OPTIONS.find((f) => f.value === exportState.format);

  return (
    <Card withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>Vista Previa de Exportación</Text>
          <Badge color={formatOption?.color}>{formatOption?.label}</Badge>
        </Group>

        <Divider />

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Archivo:</Text>
            <Code>{exportState.fileName}</Code>
          </Group>

          <Group justify="space-between">
            <Text size="sm">Contenido:</Text>
            <Group gap="xs">
              {exportState.includeTable && (
                <Badge size="sm" variant="light">
                  Tabla
                </Badge>
              )}
              {exportState.includeCharts && (
                <Badge size="sm" variant="light">
                  Gráficos
                </Badge>
              )}
              {exportState.includeMetadata && (
                <Badge size="sm" variant="light">
                  Metadatos
                </Badge>
              )}
            </Group>
          </Group>

          <Group justify="space-between">
            <Text size="sm">Registros:</Text>
            <Text size="sm" fw={500}>
              {reportData.totalRows.toLocaleString('es-AR')}
            </Text>
          </Group>

          {exportState.format === 'pdf' && (
            <Group justify="space-between">
              <Text size="sm">Configuración:</Text>
              <Text size="sm">
                {exportState.paperSize.toUpperCase()} -{' '}
                {exportState.pageOrientation === 'portrait' ? 'Vertical' : 'Horizontal'}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};
