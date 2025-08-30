import React from 'react';
import { Grid, Paper, Text, Group, Badge } from '@mantine/core';
import { IconFileText, IconCurrencyDollar } from '@tabler/icons-react';
import type { OrdenCompra } from '../../../types/ordenCompra';

interface OrdenesCompraStatsProps {
  ordenes: OrdenCompra[];
  pagination: {
    total: number;
  };
}

/**
 * Componente que muestra estadísticas de las órdenes de compra
 */
export const OrdenesCompraStats: React.FC<OrdenesCompraStatsProps> = ({ ordenes, pagination }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const pendientesCount = ordenes.filter((o) => o.estado === 'Pendiente').length;
  const facturadasCount = ordenes.filter((o) => o.estado === 'Facturada').length;
  const totalImporte = ordenes.reduce((sum, o) => sum + o.importe, 0);

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Total Órdenes
              </Text>
              <Text fw={700} size="xl">
                {pagination.total}
              </Text>
            </div>
            <IconFileText size={32} style={{ opacity: 0.6 }} />
          </Group>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Pendientes
              </Text>
              <Text fw={700} size="xl" c="yellow">
                {pendientesCount}
              </Text>
            </div>
            <Badge color="yellow" size="lg" circle>
              P
            </Badge>
          </Group>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Facturadas
              </Text>
              <Text fw={700} size="xl" c="green">
                {facturadasCount}
              </Text>
            </div>
            <Badge color="green" size="lg" circle>
              F
            </Badge>
          </Group>
        </Paper>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Total Importe
              </Text>
              <Text fw={700} size="xl" c="blue">
                {formatCurrency(totalImporte)}
              </Text>
            </div>
            <IconCurrencyDollar size={32} style={{ opacity: 0.6 }} />
          </Group>
        </Paper>
      </Grid.Col>
    </Grid>
  );
};
