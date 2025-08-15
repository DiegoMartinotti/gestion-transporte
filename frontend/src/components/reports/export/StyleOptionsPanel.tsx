import React from 'react';
import { Stack, Select, Group, NumberInput, TextInput, Alert } from '@mantine/core';
import type { ExportState, PageOrientation, PaperSize, ChartSize, TableStyle } from './types';
import { CHART_SIZE_OPTIONS, TABLE_STYLE_OPTIONS } from './constants';

interface StyleOptionsPanelProps {
  exportState: ExportState;
  onUpdate: (updates: Partial<ExportState>) => void;
}

const PAGE_ORIENTATION_OPTIONS = [
  { value: 'portrait', label: 'Vertical' },
  { value: 'landscape', label: 'Horizontal' },
];

const PAPER_SIZE_OPTIONS = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Carta' },
  { value: 'legal', label: 'Legal' },
];

export const StyleOptionsPanel: React.FC<StyleOptionsPanelProps> = ({ exportState, onUpdate }) => {
  const isPdfOrImage = ['pdf', 'image'].includes(exportState.format);

  if (!isPdfOrImage) {
    return (
      <Alert color="blue">
        Las opciones de presentación están disponibles para formatos PDF e Imagen.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Group grow>
        <Select
          label="Orientación"
          data={PAGE_ORIENTATION_OPTIONS}
          value={exportState.pageOrientation}
          onChange={(value) => onUpdate({ pageOrientation: value as PageOrientation })}
        />

        <Select
          label="Tamaño de Página"
          data={PAPER_SIZE_OPTIONS}
          value={exportState.paperSize}
          onChange={(value) => onUpdate({ paperSize: value as PaperSize })}
        />
      </Group>

      {exportState.includeCharts && (
        <Select
          label="Tamaño de Gráficos"
          data={CHART_SIZE_OPTIONS}
          value={exportState.chartSize}
          onChange={(value) => onUpdate({ chartSize: value as ChartSize })}
        />
      )}

      {exportState.includeTable && (
        <Select
          label="Estilo de Tabla"
          data={TABLE_STYLE_OPTIONS}
          value={exportState.tableStyle}
          onChange={(value) => onUpdate({ tableStyle: value as TableStyle })}
        />
      )}

      <NumberInput
        label="Tamaño de Fuente"
        value={exportState.fontSize}
        onChange={(value) => onUpdate({ fontSize: Number(value) })}
        min={8}
        max={24}
      />

      <TextInput
        label="Marca de Agua (Opcional)"
        placeholder="CONFIDENCIAL, BORRADOR, etc."
        value={exportState.watermark || ''}
        onChange={(e) => onUpdate({ watermark: e.target.value })}
      />
    </Stack>
  );
};
