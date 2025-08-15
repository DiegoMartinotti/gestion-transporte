import React from 'react';
import { Stack, TextInput, Switch, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import type { ReportDefinition } from '../../../types/reports';
import type { ExportState } from './types';

interface ContentOptionsPanelProps {
  exportState: ExportState;
  reportDefinition: ReportDefinition;
  onUpdate: (updates: Partial<ExportState>) => void;
  onRefreshFileName: () => void;
}

export const ContentOptionsPanel: React.FC<ContentOptionsPanelProps> = ({
  exportState,
  reportDefinition,
  onUpdate,
  onRefreshFileName,
}) => {
  return (
    <Stack gap="md">
      <TextInput
        label="Nombre del Archivo"
        placeholder="nombre-del-archivo"
        value={exportState.fileName}
        onChange={(e) => onUpdate({ fileName: e.target.value })}
        required
        rightSection={
          <Tooltip label="Generar nombre automático">
            <div>
              <ActionIcon variant="subtle" onClick={onRefreshFileName}>
                <IconRefresh size={16} />
              </ActionIcon>
            </div>
          </Tooltip>
        }
      />

      <TextInput
        label="Título del Reporte"
        placeholder="Título personalizado"
        value={exportState.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
      />

      <Group grow>
        <Switch
          label="Incluir Gráficos"
          description="Exportar visualizaciones del reporte"
          checked={exportState.includeCharts}
          onChange={(e) => onUpdate({ includeCharts: e.currentTarget.checked })}
          disabled={!reportDefinition.charts?.length}
        />

        <Switch
          label="Incluir Tabla"
          description="Exportar datos tabulares"
          checked={exportState.includeTable}
          onChange={(e) => onUpdate({ includeTable: e.currentTarget.checked })}
        />
      </Group>

      <Switch
        label="Incluir Metadatos"
        description="Información adicional del reporte"
        checked={exportState.includeMetadata}
        onChange={(e) => onUpdate({ includeMetadata: e.currentTarget.checked })}
      />
    </Stack>
  );
};
