import React from 'react';
import { Tabs, Paper, Group, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { ReglaTarifaBuilder, IReglaTarifa } from '../index';

interface ReglasTabPanelProps {
  onReglasChange: (reglas: IReglaTarifa[]) => void;
}

/**
 * Panel de reglas de negocio
 */
export const ReglasTabPanel: React.FC<ReglasTabPanelProps> = ({ onReglasChange }) => {
  return (
    <Tabs.Panel value="reglas" pt="xl">
      <Paper p="md" mb="md" withBorder bg="green.0">
        <Group align="center" gap="sm">
          <IconSettings size={24} color="green" />
          <div>
            <Text fw={600} size="lg">
              Constructor de Reglas de Negocio
            </Text>
            <Text size="sm" c="dimmed">
              Crea reglas que modifican automáticamente las tarifas según condiciones específicas.
              Define descuentos, recargos y modificaciones personalizadas.
            </Text>
          </div>
        </Group>
      </Paper>

      <ReglaTarifaBuilder onRuleChange={onReglasChange} />
    </Tabs.Panel>
  );
};
