import React from 'react';
import { Card, Text, Stack, Group, Badge } from '@mantine/core';
import { IconMapPin, IconFlag } from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';

interface ViajeInfoProps {
  viaje: Viaje;
}

export const ViajeInfo: React.FC<ViajeInfoProps> = ({ viaje }) => (
  <Card withBorder>
    <Text fw={600} mb="sm">
      Información del Viaje
    </Text>
    <Stack gap="xs">
      <Group gap="xs">
        <IconMapPin size={16} />
        <Text size="sm">
          <strong>Origen:</strong> {viaje.origen?.nombre}
        </Text>
      </Group>
      <Group gap="xs">
        <IconFlag size={16} />
        <Text size="sm">
          <strong>Destino:</strong> {viaje.destino?.nombre}
        </Text>
      </Group>
      <Text size="sm">
        <strong>Estado:</strong> <Badge color="blue">{viaje.estado || 'En curso'}</Badge>
      </Text>
    </Stack>
  </Card>
);
