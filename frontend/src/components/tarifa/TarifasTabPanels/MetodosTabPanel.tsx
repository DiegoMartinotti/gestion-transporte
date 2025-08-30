import React from 'react';
import { Tabs, Paper, Group, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { TarifaMetodoManager } from '../index';

/**
 * Panel de métodos de cálculo de tarifas
 */
export const MetodosTabPanel: React.FC = () => {
  return (
    <Tabs.Panel value="metodos" pt="xl">
      <Paper p="md" mb="md" withBorder bg="blue.0">
        <Group align="center" gap="sm">
          <IconSettings size={24} color="blue" />
          <div>
            <Text fw={600} size="lg">
              Métodos de Cálculo de Tarifas
            </Text>
            <Text size="sm" c="dimmed">
              Define los métodos base para el cálculo de tarifas. Configura fórmulas, variables y
              parámetros.
            </Text>
          </div>
        </Group>
      </Paper>

      <TarifaMetodoManager />
    </Tabs.Panel>
  );
};
