import { Badge, Group, Progress, Text, Tooltip, Stack } from '@mantine/core';
import { IconLock, IconLockOpen } from '@tabler/icons-react';
import type { EstadoPartida } from '../../types/ordenCompra';

interface EstadoPartidaIndicatorProps {
  estado: EstadoPartida;
  totalViaje?: number;
  totalCobrado?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showTooltip?: boolean;
}

export function EstadoPartidaIndicator({
  estado,
  totalViaje = 0,
  totalCobrado = 0,
  size = 'sm',
  showProgress = false,
  showTooltip = true
}: EstadoPartidaIndicatorProps) {
  const isAbierta = estado === 'Abierta';
  const percentage = totalViaje > 0 ? Math.min((totalCobrado / totalViaje) * 100, 100) : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getColor = () => {
    if (isAbierta) {
      return percentage < 50 ? 'red' : percentage < 80 ? 'yellow' : 'orange';
    }
    return 'green';
  };

  const getIcon = () => {
    return isAbierta ? <IconLockOpen size={14} /> : <IconLock size={14} />;
  };

  const tooltipContent = (
    <Stack gap={4}>
      <Text size="xs" fw={600}>
        Estado de Partida: {estado}
      </Text>
      {totalViaje > 0 && (
        <>
          <Text size="xs">
            Total Viaje: {formatCurrency(totalViaje)}
          </Text>
          <Text size="xs">
            Total Cobrado: {formatCurrency(totalCobrado)}
          </Text>
          <Text size="xs">
            Pendiente: {formatCurrency(Math.max(0, totalViaje - totalCobrado))}
          </Text>
          <Text size="xs">
            Progreso: {percentage.toFixed(1)}%
          </Text>
        </>
      )}
    </Stack>
  );

  const badge = (
    <Badge
      color={getColor()}
      size={size}
      leftSection={getIcon()}
      variant={isAbierta ? 'light' : 'filled'}
    >
      {estado}
    </Badge>
  );

  const indicator = showTooltip ? (
    <Tooltip label={tooltipContent} multiline w={220}>
      {badge}
    </Tooltip>
  ) : (
    badge
  );

  if (!showProgress) {
    return indicator;
  }

  return (
    <Group gap="xs" align="center">
      {indicator}
      {totalViaje > 0 && (
        <Progress
          value={percentage}
          color={getColor()}
          size="sm"
          w={60}
          radius="xl"
        />
      )}
    </Group>
  );
}