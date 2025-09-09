import React from 'react';
import { Group, Card, Text, Button } from '@mantine/core';
import { IconCalculator, IconRefresh } from '@tabler/icons-react';
import { VehicleSpecs } from './VehicleTypeDetector';

interface DetectionHeaderProps {
  vehicleSpecs: VehicleSpecs;
  detecting: boolean;
  onDetect: () => void;
}

export const DetectionHeader: React.FC<DetectionHeaderProps> = ({
  vehicleSpecs,
  detecting,
  onDetect,
}) => {
  return (
    <Card withBorder>
      <Group justify="space-between">
        <Group>
          <IconCalculator size={20} />
          <div>
            <Text fw={500}>Detector de Tipo de Unidad</Text>
            <Text size="sm" c="dimmed">
              Análisis automático basado en especificaciones técnicas
            </Text>
          </div>
        </Group>

        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={onDetect}
          loading={detecting}
          disabled={!vehicleSpecs.capacidadCarga}
        >
          Detectar
        </Button>
      </Group>
    </Card>
  );
};
