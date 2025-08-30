import React from 'react';
import { Alert, Stack, Text, Group, Button } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface TarifasQuickInfoProps {
  onQuickStart: () => void;
}

/**
 * Información rápida y guía del sistema de tarifas
 */
export const TarifasQuickInfo: React.FC<TarifasQuickInfoProps> = ({ onQuickStart }) => {
  return (
    <Alert
      icon={<IconInfoCircle size={16} />}
      title="Sistema de Tarifación Avanzada"
      color="blue"
      variant="light"
    >
      <Stack gap="sm">
        <Text size="sm">
          Este sistema permite configurar tarifas dinámicas basadas en fórmulas personalizadas y
          reglas de negocio. Incluye simulación de escenarios y auditoría completa de todos los
          cálculos.
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={onQuickStart}>
            Inicio Rápido
          </Button>
          <Text size="xs" c="dimmed">
            • Define métodos de cálculo • Crea reglas de negocio • Simula escenarios • Revisa la
            auditoría
          </Text>
        </Group>
      </Stack>
    </Alert>
  );
};
