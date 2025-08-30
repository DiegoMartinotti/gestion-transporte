import { Stack, Group, Text, Progress, Divider, Badge, Tooltip } from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconMapPin,
  IconFlag,
  IconArrowRight,
  IconTruck,
  IconPackage,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { Viaje } from '../../../types/viaje';
import { getClienteText } from '../../../utils/viajeHelpers';
import { formatDate, formatCurrency, getProgressValue, getProgressColor } from './viajeCardHelpers';

interface ViajeCardDetailsProps {
  viaje: Viaje;
}

const VehicleInfo = ({ viaje }: { viaje: Viaje }) => (
  <Group>
    <Group gap={4}>
      <IconTruck size={14} color="gray" />
      <Text size="xs" c="dimmed">
        {viaje.vehiculos?.length || 0} vehículo{(viaje.vehiculos?.length || 0) !== 1 ? 's' : ''}
      </Text>
    </Group>
    <Group gap={4}>
      <IconUser size={14} color="gray" />
      <Text size="xs" c="dimmed">
        {viaje.choferes?.length || 0} chofer{(viaje.choferes?.length || 0) !== 1 ? 'es' : ''}
      </Text>
    </Group>
    {viaje.carga?.peso && (
      <Group gap={4}>
        <IconPackage size={14} color="gray" />
        <Text size="xs" c="dimmed">
          {viaje.carga.peso} kg
        </Text>
      </Group>
    )}
  </Group>
);

const CargaBadges = ({ viaje }: { viaje: Viaje }) => (
  <Group gap={4}>
    {viaje.carga?.peligrosa && (
      <Tooltip label="Carga peligrosa">
        <Badge color="red" size="xs">
          ⚠
        </Badge>
      </Tooltip>
    )}
    {viaje.carga?.refrigerada && (
      <Tooltip label="Carga refrigerada">
        <Badge color="blue" size="xs">
          ❄
        </Badge>
      </Tooltip>
    )}
    {viaje.distanciaKm && (
      <Badge variant="light" size="xs">
        {viaje.distanciaKm} km
      </Badge>
    )}
  </Group>
);

export function ViajeCardDetails({ viaje }: ViajeCardDetailsProps) {
  return (
    <Stack gap="sm">
      <Group gap="xs">
        <IconCalendar size={14} color="gray" />
        <Text size="sm">{formatDate(viaje.fecha)}</Text>
      </Group>

      <Group gap="xs">
        <IconUser size={14} color="gray" />
        <Text size="sm" fw={500}>
          {getClienteText(viaje)}
        </Text>
      </Group>

      <Stack gap={4}>
        <Group gap="xs">
          <IconMapPin size={14} color="gray" />
          <Text size="sm" fw={500}>
            {viaje.tramo?.denominacion}
          </Text>
        </Group>
        <Group gap={4} ml={20}>
          <Group gap={4}>
            <IconFlag size={12} color="green" />
            <Text size="xs" c="dimmed">
              {viaje.tramo?.origen?.denominacion}
            </Text>
          </Group>
          <IconArrowRight size={12} />
          <Group gap={4}>
            <IconFlag size={12} color="red" />
            <Text size="xs" c="dimmed">
              {viaje.tramo?.destino?.denominacion}
            </Text>
          </Group>
        </Group>
      </Stack>

      <VehicleInfo viaje={viaje} />

      <Progress
        value={getProgressValue(viaje.estado)}
        color={getProgressColor(viaje.estado)}
        size="sm"
        radius="xs"
      />

      <Divider />

      <Group justify="space-between">
        <Group gap="xs">
          <IconCurrencyDollar size={14} />
          {viaje.montoTotal ? (
            <Text size="sm" fw={600} c="green">
              {formatCurrency(viaje.montoTotal)}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Sin calcular
            </Text>
          )}
        </Group>

        <CargaBadges viaje={viaje} />
      </Group>
    </Stack>
  );
}
