import React from 'react';
import { Tabs, Paper, Group, Text } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { TarifaSimulator, ITarifaMetodo, IReglaTarifa } from '../index';

interface SimuladorTabPanelProps {
  metodosDisponibles: ITarifaMetodo[];
  reglasDisponibles: IReglaTarifa[];
}

/**
 * Panel del simulador de escenarios
 */
export const SimuladorTabPanel: React.FC<SimuladorTabPanelProps> = ({
  metodosDisponibles,
  reglasDisponibles,
}) => {
  return (
    <Tabs.Panel value="simulador" pt="xl">
      <Paper p="md" mb="md" withBorder bg="orange.0">
        <Group align="center" gap="sm">
          <IconPlayerPlay size={24} color="orange" />
          <div>
            <Text fw={600} size="lg">
              Simulador de Escenarios
            </Text>
            <Text size="sm" c="dimmed">
              Prueba diferentes escenarios de cálculo. Compara resultados y analiza el impacto de
              las reglas en distintas situaciones.
            </Text>
          </div>
        </Group>
      </Paper>

      <TarifaSimulator
        metodosDisponibles={metodosDisponibles}
        reglasDisponibles={reglasDisponibles}
      />
    </Tabs.Panel>
  );
};
