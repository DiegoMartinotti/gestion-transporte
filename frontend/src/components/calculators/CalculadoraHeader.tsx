import React from 'react';
import { Group, Title, ActionIcon, Tooltip } from '@mantine/core';
import { IconCalculator, IconHistory, IconSettings, IconRefresh } from '@tabler/icons-react';

type ActiveView = 'calculadora' | 'versiones' | 'configuracion';

interface CalculadoraHeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const CalculadoraHeader: React.FC<CalculadoraHeaderProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <Group justify="space-between">
      <Group gap="sm">
        <IconCalculator size={32} color="blue" />
        <Title order={2}>Calculadora de Tarifas</Title>
      </Group>

      <Group gap="xs">
        <ActionIcon
          variant="light"
          color="blue"
          onClick={() => onViewChange('calculadora')}
          size="lg"
          style={{
            backgroundColor:
              activeView === 'calculadora' ? 'var(--mantine-color-blue-1)' : undefined,
          }}
        >
          <Tooltip label="Calculadora">
            <IconCalculator size={18} />
          </Tooltip>
        </ActionIcon>

        <ActionIcon
          variant="light"
          color="orange"
          onClick={() => onViewChange('versiones')}
          size="lg"
          style={{
            backgroundColor:
              activeView === 'versiones' ? 'var(--mantine-color-orange-1)' : undefined,
          }}
        >
          <Tooltip label="Versiones">
            <IconHistory size={18} />
          </Tooltip>
        </ActionIcon>

        <ActionIcon
          variant="light"
          color="gray"
          onClick={() => onViewChange('configuracion')}
          size="lg"
          style={{
            backgroundColor:
              activeView === 'configuracion' ? 'var(--mantine-color-gray-1)' : undefined,
          }}
        >
          <Tooltip label="Configuración">
            <IconSettings size={18} />
          </Tooltip>
        </ActionIcon>

        <ActionIcon variant="light" onClick={() => window.location.reload()}>
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>
    </Group>
  );
};
