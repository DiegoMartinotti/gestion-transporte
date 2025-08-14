import React from 'react';
import { Stack, Grid, Paper, Group, Text, Badge } from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconMapPin,
  IconFlag,
  IconArrowRight,
  IconFileText,
} from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';
import { getClienteText } from '../../utils/viajeHelpers';

interface ViajeGeneralTabProps {
  viaje: Viaje;
  formatDate: (date: string) => string;
}

export const ViajeGeneralTab: React.FC<ViajeGeneralTabProps> = ({ viaje, formatDate }) => {
  return (
    <Stack>
      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Group gap="xs" mb="xs">
              <IconCalendar size={16} />
              <Text size="sm" fw={600} c="dimmed">
                FECHA
              </Text>
            </Group>
            <Text size="lg">{formatDate(viaje.fecha)}</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Group gap="xs" mb="xs">
              <IconUser size={16} />
              <Text size="sm" fw={600} c="dimmed">
                CLIENTE
              </Text>
            </Group>
            <Text size="lg">{getClienteText(viaje)}</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper p="md" withBorder>
        <Group gap="xs" mb="xs">
          <IconMapPin size={16} />
          <Text size="sm" fw={600} c="dimmed">
            RUTA
          </Text>
        </Group>
        <Text size="lg" fw={500} mb="xs">
          {viaje.tramo?.denominacion}
        </Text>
        <Group gap="md">
          <Group gap={4}>
            <IconFlag size={14} color="green" />
            <Text size="sm">{viaje.tramo?.origen?.denominacion}</Text>
          </Group>
          <IconArrowRight size={14} />
          <Group gap={4}>
            <IconFlag size={14} color="red" />
            <Text size="sm">{viaje.tramo?.destino?.denominacion}</Text>
          </Group>
        </Group>
        <Group mt="xs">
          <Badge variant="light">{viaje.distanciaKm} km</Badge>
          <Badge variant="light">{viaje.tiempoEstimadoHoras}h estimadas</Badge>
        </Group>
      </Paper>

      {viaje.ordenCompra && (
        <Paper p="md" withBorder>
          <Group gap="xs" mb="xs">
            <IconFileText size={16} />
            <Text size="sm" fw={600} c="dimmed">
              ORDEN DE COMPRA
            </Text>
          </Group>
          <Badge color="indigo" size="lg">
            OC-{viaje.ordenCompra}
          </Badge>
        </Paper>
      )}

      {viaje.observaciones && (
        <Paper p="md" withBorder>
          <Text size="sm" fw={600} c="dimmed" mb="xs">
            OBSERVACIONES
          </Text>
          <Text>{viaje.observaciones}</Text>
        </Paper>
      )}
    </Stack>
  );
};
