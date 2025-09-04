import { Group, Card, Text } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import type { Vehiculo } from '../../../types';

interface VehicleInfoProps {
  vehiculo?: Vehiculo;
}

export function VehicleInfo({ vehiculo }: VehicleInfoProps) {
  if (!vehiculo) return null;

  return (
    <Card withBorder radius="sm" bg="gray.0">
      <Group>
        <IconTruck size={16} />
        <div>
          <Text size="sm" fw={500}>
            {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
          </Text>
          <Text size="xs" c="dimmed">
            Tipo: {vehiculo.tipo} • Estado: {vehiculo.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
