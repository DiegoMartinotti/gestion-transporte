import React from 'react';
import { Paper, Text, Group, Switch, Select } from '@mantine/core';
import type { ReferenceConfig } from '../ReferenceDataSheets';

interface ConfigurationPanelProps {
  config: ReferenceConfig;
  onConfigChange: (config: ReferenceConfig) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
}) => {
  const handleChange = (updates: Partial<ReferenceConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Paper p="md" withBorder>
      <Text fw={500} size="sm" mb="md">
        Configuración de Generación
      </Text>

      <Group gap="md">
        <Switch
          label="Incluir instrucciones"
          description="Hoja con guía de uso"
          checked={config.includeInstructions}
          onChange={(event) => handleChange({ includeInstructions: event.currentTarget.checked })}
        />

        <Switch
          label="Solo registros activos"
          description="Excluir registros inactivos"
          checked={config.onlyActiveRecords}
          onChange={(event) => handleChange({ onlyActiveRecords: event.currentTarget.checked })}
        />
      </Group>

      <Group gap="md" mt="md">
        <Select
          label="Máximo por hoja"
          description="Limitar registros por rendimiento"
          value={config.maxRecordsPerSheet.toString()}
          onChange={(value) =>
            handleChange({
              maxRecordsPerSheet: parseInt(value || '1000'),
            })
          }
          data={[
            { value: '100', label: '100 registros' },
            { value: '500', label: '500 registros' },
            { value: '1000', label: '1000 registros' },
            { value: '0', label: 'Sin límite' },
          ]}
          style={{ minWidth: 150 }}
        />
      </Group>
    </Paper>
  );
};
