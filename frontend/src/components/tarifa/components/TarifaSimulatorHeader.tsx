import React from 'react';
import { Group, Button, Title, Text, Alert, Progress } from '@mantine/core';
import { IconPlayerPlay, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

interface TarifaSimulatorHeaderProps {
  escenarios: unknown[];
  simulando: boolean;
  onSimular: () => void;
  onLimpiar: () => void;
}

const TarifaSimulatorHeader: React.FC<TarifaSimulatorHeaderProps> = ({
  escenarios,
  simulando,
  onSimular,
  onLimpiar,
}) => {
  return (
    <>
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={3}>Simulador de Tarifas</Title>
          <Text size="sm" c="dimmed">
            Prueba diferentes escenarios y compara los resultados del cálculo de tarifas
          </Text>
        </div>

        <Group>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={onLimpiar}>
            Limpiar
          </Button>

          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={onSimular}
            loading={simulando}
            disabled={escenarios.length === 0}
          >
            Ejecutar Simulación
          </Button>
        </Group>
      </Group>

      {/* Progress indicator */}
      {simulando && (
        <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
          <Group justify="space-between">
            <Text size="sm">Procesando simulación...</Text>
            <Progress value={100} size="sm" w={200} animated />
          </Group>
        </Alert>
      )}
    </>
  );
};

export default TarifaSimulatorHeader;