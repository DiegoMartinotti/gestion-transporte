import React from 'react';
import { Stack, Group, Text, Card, Divider, ActionIcon } from '@mantine/core';
import { IconMapPin, IconRoad, IconCalculator } from '@tabler/icons-react';
import { Tramo } from '../TramoDetail.types';

interface TramoInfoCardProps {
  tramo: Tramo;
  onRecalculateDistance: () => void;
}

const TramoInfoCard: React.FC<TramoInfoCardProps> = ({ tramo, onRecalculateDistance }) => {
  return (
    <Card withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Cliente
          </Text>
          <Text fw={500}>{tramo.cliente.nombre}</Text>
        </Group>

        <Divider />

        <Group justify="space-between">
          <Group>
            <IconMapPin size={16} color="green" />
            <Text size="sm" c="dimmed">
              Origen
            </Text>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={500}>{tramo.origen.nombre}</Text>
            <Text size="xs" c="dimmed">
              {tramo.origen.direccion}
            </Text>
          </Stack>
        </Group>

        <Group justify="center">
          <Group gap="xs">
            <IconRoad size={16} />
            <Text fw={500}>{tramo.distancia} km</Text>
            <ActionIcon
              size="sm"
              variant="light"
              onClick={onRecalculateDistance}
              title="Recalcular distancia"
            >
              <IconCalculator size={14} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between">
          <Group>
            <IconMapPin size={16} color="red" />
            <Text size="sm" c="dimmed">
              Destino
            </Text>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={500}>{tramo.destino.nombre}</Text>
            <Text size="xs" c="dimmed">
              {tramo.destino.direccion}
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};

export default TramoInfoCard;
