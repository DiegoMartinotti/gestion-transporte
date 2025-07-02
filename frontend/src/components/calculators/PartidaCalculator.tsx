import React, { useState, useEffect } from 'react';
import { Paper, Title, Grid, Card, Text, Badge, Group, Progress, Button, Select, Alert } from '@mantine/core';
import { IconCalculator, IconTrendingUp, IconTrendingDown, IconCurrency, IconAlertTriangle } from '@tabler/icons-react';
import { EstadoPartida } from '../../types/ordenCompra';

interface PartidaData {
  numero: string;
  descripcion: string;
  montoOriginal: number;
  importePagado: number;
  importePendiente: number;
  estado: EstadoPartida;
  fechaVencimiento?: Date;
}

interface PartidaCalculatorProps {
  partidas: PartidaData[];
  onStateChange?: (partidaNumero: string, nuevoEstado: EstadoPartida) => void;
  readonly?: boolean;
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

export const PartidaCalculator: React.FC<PartidaCalculatorProps> = ({
  partidas,
  onStateChange,
  readonly = false
}) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasPartidas>({
    totalPartidas: 0,
    abiertas: 0,
    pagadas: 0,
    vencidas: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoPendiente: 0,
    porcentajePagado: 0
  });

  const calcularEstadisticas = () => {
    const ahora = new Date();
    
    const stats = partidas.reduce(
      (acc, partida) => {
        acc.totalPartidas++;
        acc.montoTotal += partida.montoOriginal;
        acc.montoPagado += partida.importePagado;
        acc.montoPendiente += partida.importePendiente;

        switch (partida.estado) {
          case 'abierta':
            acc.abiertas++;
            if (partida.fechaVencimiento && partida.fechaVencimiento < ahora) {
              acc.vencidas++;
            }
            break;
          case 'pagada':
            acc.pagadas++;
            break;
        }

        return acc;
      },
      {
        totalPartidas: 0,
        abiertas: 0,
        pagadas: 0,
        vencidas: 0,
        montoTotal: 0,
        montoPagado: 0,
        montoPendiente: 0,
        porcentajePagado: 0
      }
    );

    stats.porcentajePagado = stats.montoTotal > 0 ? (stats.montoPagado / stats.montoTotal) * 100 : 0;

    setEstadisticas(stats);
  };

  const calcularNuevoEstado = (partida: PartidaData): EstadoPartida => {
    const tolerancia = 0.01; // Tolerancia para diferencias de centavos
    
    if (Math.abs(partida.importePendiente) <= tolerancia) {
      return 'pagada';
    } else if (partida.importePendiente > 0) {
      const ahora = new Date();
      if (partida.fechaVencimiento && partida.fechaVencimiento < ahora) {
        return 'vencida';
      }
      return 'abierta';
    }
    
    return partida.estado;
  };

  const actualizarEstadosAutomatico = () => {
    partidas.forEach(partida => {
      const nuevoEstado = calcularNuevoEstado(partida);
      if (nuevoEstado !== partida.estado && onStateChange) {
        onStateChange(partida.numero, nuevoEstado);
      }
    });
  };

  useEffect(() => {
    calcularEstadisticas();
  }, [partidas]);

  const getEstadoColor = (estado: EstadoPartida) => {
    switch (estado) {
      case 'abierta': return 'blue';
      case 'pagada': return 'green';
      case 'vencida': return 'red';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconCalculator size={20} />
          <Title order={4}>Calculadora de Partidas</Title>
        </Group>
        {!readonly && (
          <Button 
            variant="light" 
            size="sm"
            onClick={actualizarEstadosAutomatico}
          >
            Recalcular Estados
          </Button>
        )}
      </Group>

      {/* Estadísticas Generales */}
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
              {formatCurrency(estadisticas.montoPendiente)}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Progreso de Pagos */}
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

      {/* Estados por Categoría */}
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

      {/* Alertas de Vencimientos */}
      {estadisticas.vencidas > 0 && (
        <Alert 
          icon={<IconAlertTriangle size={16} />} 
          title="Partidas Vencidas"
          color="red"
          mb="md"
        >
          Hay {estadisticas.vencidas} partida(s) vencida(s) que requieren atención inmediata.
        </Alert>
      )}

      {/* Lista Detallada de Partidas */}
      <Title order={5} mb="sm">Detalle por Partida</Title>
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
                  <Text span fw={500}>Original:</Text> {formatCurrency(partida.montoOriginal)}
                </Text>
                <Text size="sm">
                  <Text span fw={500}>Pagado:</Text> {formatCurrency(partida.importePagado)}
                </Text>
                <Text size="sm" c={partida.importePendiente > 0 ? 'orange' : 'green'}>
                  <Text span fw={500}>Pendiente:</Text> {formatCurrency(partida.importePendiente)}
                </Text>
              </Group>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              {!readonly && (
                <Select
                  data={[
                    { value: 'abierta', label: 'Abierta' },
                    { value: 'pagada', label: 'Pagada' },
                    { value: 'vencida', label: 'Vencida' }
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
    </Paper>
  );
};