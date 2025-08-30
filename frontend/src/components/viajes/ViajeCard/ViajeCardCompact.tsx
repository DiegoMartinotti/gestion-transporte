import { Card, Group, Text, Badge } from '@mantine/core';
import { Viaje } from '../../../types/viaje';
import { getClienteText } from '../../../utils/viajeHelpers';
import { formatCurrency, formatDate, getEstadoBadgeColor } from './viajeCardHelpers';

interface ViajeCardCompactProps {
  viaje: Viaje;
  onClick?: (viaje: Viaje) => void;
}

export function ViajeCardCompact({ viaje, onClick }: ViajeCardCompactProps) {
  const cardProps = onClick
    ? {
        onClick: () => onClick(viaje),
        style: { cursor: 'pointer' },
      }
    : {};

  return (
    <Card {...cardProps} padding="sm" withBorder>
      <Group justify="space-between">
        <Group gap="xs">
          <Text size="sm" fw={600}>
            #{viaje.numeroViaje}
          </Text>
          <Badge color={getEstadoBadgeColor(viaje.estado)} size="sm">
            {viaje.estado}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {formatDate(viaje.fecha)}
        </Text>
      </Group>

      <Text size="sm" mt="xs">
        {getClienteText(viaje)}
      </Text>
      <Text size="xs" c="dimmed" truncate>
        {viaje.tramo?.origen?.denominacion} → {viaje.tramo?.destino?.denominacion}
      </Text>

      {viaje.montoTotal && (
        <Text size="sm" fw={600} c="green" mt="xs">
          {formatCurrency(viaje.montoTotal)}
        </Text>
      )}
    </Card>
  );
}
