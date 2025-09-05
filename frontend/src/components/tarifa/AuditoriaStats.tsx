import React from 'react';
import { Grid, Paper, Group, Text, Alert } from '@mantine/core';
import {
  IconDatabase,
  IconBug,
  IconClock,
  IconTrendingUp,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface EstadisticasData {
  total: number;
  conErrores: number;
  porcentajeErrores: number;
  tiempoPromedio: number;
  tiempoMaximo: number;
  reglasMasUsadas: Array<{ regla: string; count: number }>;
}

interface AuditoriaStatsProps {
  estadisticas: EstadisticasData | null;
}

/* eslint-disable max-lines-per-function */
const AuditoriaStats: React.FC<AuditoriaStatsProps> = ({ estadisticas }) => {
  if (!estadisticas) return null;

  return (
    <>
      {/* Estadísticas rápidas */}
      <Grid>
        <Grid.Col span={2.4}>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Total Cálculos
                </Text>
                <Text fw={600} size="lg">
                  {estadisticas.total}
                </Text>
              </div>
              <IconDatabase size={32} color="blue" />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={2.4}>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Con Errores
                </Text>
                <Text fw={600} size="lg" c={estadisticas.conErrores > 0 ? 'red' : 'green'}>
                  {estadisticas.conErrores}
                </Text>
                <Text size="xs" c="dimmed">
                  ({estadisticas.porcentajeErrores.toFixed(1)}%)
                </Text>
              </div>
              <IconBug size={32} color={estadisticas.conErrores > 0 ? 'red' : 'green'} />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={2.4}>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Tiempo Promedio
                </Text>
                <Text fw={600} size="lg">
                  {estadisticas.tiempoPromedio}ms
                </Text>
              </div>
              <IconClock size={32} color="gray" />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={2.4}>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Tiempo Máximo
                </Text>
                <Text fw={600} size="lg" c={estadisticas.tiempoMaximo > 100 ? 'red' : 'orange'}>
                  {estadisticas.tiempoMaximo}ms
                </Text>
              </div>
              <IconTrendingUp
                size={32}
                color={estadisticas.tiempoMaximo > 100 ? 'red' : 'orange'}
              />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={2.4}>
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Regla Más Usada
                </Text>
                <Text fw={600} size="sm" lineClamp={1}>
                  {estadisticas.reglasMasUsadas[0]?.regla || 'N/A'}
                </Text>
                <Text size="xs" c="dimmed">
                  {estadisticas.reglasMasUsadas[0]?.count || 0}x
                </Text>
              </div>
              <IconCheck size={32} color="green" />
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Alerts for issues */}
      {estadisticas.conErrores > 0 && (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
          <Text>
            Se detectaron {estadisticas.conErrores} cálculos con errores (
            {estadisticas.porcentajeErrores.toFixed(1)}% del total). Revisa los detalles para
            identificar posibles problemas en las fórmulas o datos.
          </Text>
        </Alert>
      )}

      {estadisticas.tiempoMaximo > 100 && (
        <Alert color="yellow" variant="light" icon={<IconClock size={16} />}>
          <Text>
            Se detectaron cálculos con tiempo de respuesta elevado (máximo:{' '}
            {estadisticas.tiempoMaximo}ms). Considera optimizar las fórmulas complejas.
          </Text>
        </Alert>
      )}
    </>
  );
};

export default AuditoriaStats;
