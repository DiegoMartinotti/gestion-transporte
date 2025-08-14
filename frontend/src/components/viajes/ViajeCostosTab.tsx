import { FC } from 'react';
import { Stack, Group, Text, Button, Grid, Paper, Table } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';

interface ViajeCostosTabProps {
  viaje: Viaje;
  formatCurrency: (value: number) => string;
  onShowCalculationDetails: () => void;
}

export const ViajeCostosTab: FC<ViajeCostosTabProps> = ({
  viaje,
  formatCurrency,
  onShowCalculationDetails,
}) => {
  return (
    <Stack>
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Desglose de Costos
        </Text>
        <Button variant="light" leftSection={<IconEye />} onClick={onShowCalculationDetails}>
          Ver Cálculo Detallado
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Monto Base
            </Text>
            <Text size="xl" fw={700}>
              {formatCurrency(viaje.montoBase || 0)}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Extras
            </Text>
            <Text size="xl" fw={700}>
              {formatCurrency(viaje.montoExtras || 0)}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="md" withBorder>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Total
            </Text>
            <Text size="xl" fw={700} c="green">
              {formatCurrency(viaje.montoTotal || 0)}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {viaje.extras && viaje.extras.length > 0 && (
        <Paper p="md" withBorder>
          <Text size="sm" fw={600} c="dimmed" mb="md">
            EXTRAS
          </Text>
          <Table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Descripción</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {viaje.extras.map((extra, index) => (
                <tr key={index}>
                  <td>{extra.concepto}</td>
                  <td>{extra.descripcion || '-'}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(extra.monto)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};
