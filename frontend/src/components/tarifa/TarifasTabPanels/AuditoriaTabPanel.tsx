import React from 'react';
import { Tabs, Paper, Group, Text } from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';
import { AuditoriaViewer } from '../index';

/**
 * Panel de auditoría y monitoreo
 */
export const AuditoriaTabPanel: React.FC = () => {
  return (
    <Tabs.Panel value="auditoria" pt="xl">
      <Paper p="md" mb="md" withBorder bg="purple.0">
        <Group align="center" gap="sm">
          <IconHistory size={24} color="purple" />
          <div>
            <Text fw={600} size="lg">
              Auditoría y Monitoreo
            </Text>
            <Text size="sm" c="dimmed">
              Revisa el historial completo de cálculos. Analiza performance, errores y tendencias
              del sistema de tarifación.
            </Text>
          </div>
        </Group>
      </Paper>

      <AuditoriaViewer showMetrics={true} showFilters={true} />
    </Tabs.Panel>
  );
};
