import React from 'react';
import { Grid, Card, Text, Progress, Group, Alert, Select, Badge } from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCurrency,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { EstadoPartida } from '../../../types/ordenCompra';

interface PartidaData {
  numero: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
}

interface EstadisticasPartidas {
  totalPartidas: number;
  abiertas: number;
  pagadas: number;
  vencidas: number;
  montoTotal: number;
  montoPagado: number;
  montoPendiente: number;
  porcentajePagado: number;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getEstadoColor = (estado: EstadoPartida) => {
  switch (estado) {
    case 'abierta':
      return 'blue';
    case 'pagada':
      return 'green';
    case 'vencida':
      return 'red';
    default:
      return 'gray';
  }
};

interface EstadisticasGridProps {
  estadisticas: EstadisticasPartidas;
}

export const EstadisticasGrid: React.FC<EstadisticasGridProps> = ({ estadisticas }) => (
  <Grid mb="md">
    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Total Partidas
        </Text>
        <Text size="xl" fw={700}>
          {estadisticas.totalPartidas}
        </Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Monto Total
        </Text>
        <Text size="xl" fw={700} c="blue">
          {formatCurrency(estadisticas.montoTotal)}
        </Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Pagado
        </Text>
        <Text size="xl" fw={700} c="green">
          {formatCurrency(estadisticas.montoPagado)}
        </Text>
      </Card>
    </Grid.Col>

    <Grid.Col span={3}>
      <Card withBorder>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          Pendiente
        </Text>
        <Text size="xl" fw={700} c="orange">
          {formatCurrency(estadisticas.montePendiente)}
        </Text>
      </Card>
    </Grid.Col>
  </Grid>
);

interface ProgressSectionProps {
  estadisticas: EstadisticasPartidas;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({ estadisticas }) => (
  <Card withBorder mb="md">
    <Group justify="space-between" mb="xs">
      <Text fw={500}>Progreso de Pagos</Text>
      <Text size="sm" c="dimmed">
        {estadisticas.porcentajePagado.toFixed(1)}%
      </Text>
    </Group>
    <Progress
      value={estadisticas.porcentajePagado}
      size="lg"
      color={estadisticas.porcentajePagado === 100 ? 'green' : 'blue'}
    />
  </Card>
);

interface EstadosCategoriasProps {
  estadisticas: EstadisticasPartidas;
}

export const EstadosCategorias: React.FC<EstadosCategoriasProps> = ({ estadisticas }) => (
  <Grid mb="md">
    <Grid.Col span={4}>
      <Card withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Abiertas
            </Text>
            <Text size="lg" fw={700} c="blue">
              {estadisticas.abiertas}
            </Text>
          </div>
          <IconTrendingUp size={24} color="var(--mantine-color-blue-6)" />
        </Group>
      </Card>
    </Grid.Col>

    <Grid.Col span={4}>
      <Card withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Pagadas
            </Text>
            <Text size="lg" fw={700} c="green">
              {estadisticas.pagadas}
            </Text>
          </div>
          <IconCurrency size={24} color="var(--mantine-color-green-6)" />
        </Group>
      </Card>
    </Grid.Col>

    <Grid.Col span={4}>
      <Card withBorder>
        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Vencidas
            </Text>
            <Text size="lg" fw={700} c="red">
              {estadisticas.vencidas}
            </Text>
          </div>
          <IconTrendingDown size={24} color="var(--mantine-color-red-6)" />
        </Group>
      </Card>
    </Grid.Col>
  </Grid>
);

interface AlertasVencimientosProps {
  estadisticas: EstadisticasPartidas;
}

export const AlertasVencimientos: React.FC<AlertasVencimientosProps> = ({ estadisticas }) => {
  if (estadisticas.vencidas === 0) return null;

  return (
    <Alert icon={<IconAlertTriangle size={16} />} title="Partidas Vencidas" color="red" mb="md">
      Hay {estadisticas.vencidas} partida(s) vencida(s) que requieren atención inmediata.
    </Alert>
  );
};

interface DetallePartidasProps {
  partidas: PartidaData[];
  readonly?: boolean;
  onStateChange?: (partidaNumero: string, nuevoEstado: EstadoPartida) => void;
}

export const DetallePartidas: React.FC<DetallePartidasProps> = ({
  partidas,
  readonly = false,
  onStateChange,
}) => (
  <>
    {partidas.map((partida) => (
      <Card key={partida.numero} withBorder mb="xs">
        <Group justify="space-between">
          <div>
            <Group gap="xs" mb="xs">
              <Text fw={500}>{partida.numero}</Text>
              <Badge color={getEstadoColor(partida.estado)} size="sm">
                {partida.estado.toUpperCase()}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" mb="xs">
              {partida.descripcion}
            </Text>
            <Group gap="lg">
              <Text size="sm">
                <Text span fw={500}>
                  Original:
                </Text>{' '}
                {formatCurrency(partida.montoOriginal)}
              </Text>
              <Text size="sm">
                <Text span fw={500}>
                  Pagado:
                </Text>{' '}
                {formatCurrency(partida.importePagado)}
              </Text>
              <Text size="sm" c={partida.importePendiente > 0 ? 'orange' : 'green'}>
                <Text span fw={500}>
                  Pendiente:
                </Text>{' '}
                {formatCurrency(partida.importePendiente)}
              </Text>
            </Group>
          </div>

          <div style={{ textAlign: 'right' }}>
            {!readonly && (
              <Select
                data={[
                  { value: 'abierta', label: 'Abierta' },
                  { value: 'pagada', label: 'Pagada' },
                  { value: 'vencida', label: 'Vencida' },
                ]}
                value={partida.estado}
                onChange={(value) => {
                  if (value && onStateChange) {
                    onStateChange(partida.numero, value as EstadoPartida);
                  }
                }}
                size="xs"
                w={100}
              />
            )}
            {partida.fechaVencimiento && (
              <Text size="xs" c="dimmed" mt="xs">
                Vence: {partida.fechaVencimiento.toLocaleDateString()}
              </Text>
            )}
          </div>
        </Group>
      </Card>
    ))}
  </>
);
