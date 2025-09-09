import React from 'react';
import { Group, Card, Text } from '@mantine/core';
import { VehicleSpecs } from './VehicleTypeDetector';

interface AnalysisParametersProps {
  vehicleSpecs: VehicleSpecs;
  cargaEstimada?: number;
}

export const AnalysisParameters: React.FC<AnalysisParametersProps> = ({
  vehicleSpecs,
  cargaEstimada,
}) => {
  return (
    <Card withBorder>
      <Text fw={500} mb="md">
        Parámetros de Análisis
      </Text>
      <Group grow>
        <div>
          <Text size="sm" fw={500}>
            Capacidad de Carga
          </Text>
          <Text size="sm" c="dimmed">
            {vehicleSpecs.capacidadCarga || 'No especificada'} kg
          </Text>
        </div>
        {vehicleSpecs.tipoCarroceria && (
          <div>
            <Text size="sm" fw={500}>
              Tipo de Carrocería
            </Text>
            <Text size="sm" c="dimmed">
              {vehicleSpecs.tipoCarroceria}
            </Text>
          </div>
        )}
        {vehicleSpecs.cantidadEjes && (
          <div>
            <Text size="sm" fw={500}>
              Cantidad de Ejes
            </Text>
            <Text size="sm" c="dimmed">
              {vehicleSpecs.cantidadEjes}
            </Text>
          </div>
        )}
        {cargaEstimada && (
          <div>
            <Text size="sm" fw={500}>
              Carga Estimada
            </Text>
            <Text size="sm" c="dimmed">
              {cargaEstimada} kg
            </Text>
          </div>
        )}
      </Group>
    </Card>
  );
};
