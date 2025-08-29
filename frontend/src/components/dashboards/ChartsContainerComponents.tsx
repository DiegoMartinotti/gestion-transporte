import React from 'react';
import { Paper, Stack, Title, Group, SegmentedControl, Text, SimpleGrid } from '@mantine/core';
import { AreaChart, BarChart, LineChart, DonutChart } from '@mantine/charts';
import { ChartsData } from './ChartsContainerHelpers';

export const LoadingCharts = () => (
  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
    {Array.from({ length: 4 }).map((_, index) => (
      <Paper key={index} p="md" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Cargando...</Title>
          <div style={{ height: 300, background: '#f8f9fa', borderRadius: 8 }} />
        </Stack>
      </Paper>
    ))}
  </SimpleGrid>
);

interface FacturacionChartProps {
  data: ChartsData['facturacion'];
  period: string;
  onPeriodChange: (period: string) => void;
  currencyFormatter: (value: number) => string;
}

export const FacturacionChart = ({ data, period, onPeriodChange, currencyFormatter }: FacturacionChartProps) => (
  <Paper p="md" radius="md" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>Facturación Mensual</Title>
        <SegmentedControl
          size="xs"
          value={period}
          onChange={onPeriodChange}
          data={[
            { label: '3M', value: '3m' },
            { label: '6M', value: '6m' },
            { label: '1A', value: '1y' }
          ]}
        />
      </Group>
      
      <AreaChart
        h={300}
        data={data}
        dataKey="mes"
        series={[
          { name: 'monto', color: 'green.6' }
        ]}
        curveType="linear"
        tickLine="xy"
        gridAxis="xy"
        withXAxis
        withYAxis
        withTooltip
        tooltipAnimationDuration={200}
        valueFormatter={currencyFormatter}
      />
    </Stack>
  </Paper>
);

interface ViajesChartProps {
  data: ChartsData['viajes'];
  period: string;
  onPeriodChange: (period: string) => void;
}

export const ViajesChart = ({ data, period, onPeriodChange }: ViajesChartProps) => (
  <Paper p="md" radius="md" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4}>Estado de Viajes</Title>
        <SegmentedControl
          size="xs"
          value={period}
          onChange={onPeriodChange}
          data={[
            { label: '3M', value: '3m' },
            { label: '6M', value: '6m' },
            { label: '1A', value: '1y' }
          ]}
        />
      </Group>
      
      <BarChart
        h={300}
        data={data}
        dataKey="mes"
        series={[
          { name: 'completados', color: 'green.6', label: 'Completados' },
          { name: 'pendientes', color: 'yellow.6', label: 'Pendientes' },
          { name: 'cancelados', color: 'red.6', label: 'Cancelados' }
        ]}
        tickLine="y"
        gridAxis="y"
        withXAxis
        withYAxis
        withLegend
        withTooltip
        tooltipAnimationDuration={200}
      />
    </Stack>
  </Paper>
);

interface VehiculosChartProps {
  data: ChartsData['vehiculos'];
}

export const VehiculosChart = ({ data }: VehiculosChartProps) => (
  <Paper p="md" radius="md" withBorder>
    <Stack gap="md">
      <Title order={4}>Distribución de Vehículos</Title>
      
      <DonutChart
        h={300}
        data={data}
        chartLabel="Total Vehículos"
        withLabelsLine
        withLabels
        withTooltip
        tooltipDataSource="segment"
        mx="auto"
        paddingAngle={2}
        strokeWidth={1}
      />
    </Stack>
  </Paper>
);

interface ClientesChartProps {
  data: ChartsData['clientes'];
  avgNewClients: number;
}

export const ClientesChart = ({ data, avgNewClients }: ClientesChartProps) => (
  <Paper p="md" radius="md" withBorder>
    <Stack gap="md">
      <Title order={4}>Evolución de Clientes</Title>
      
      <LineChart
        h={300}
        data={data}
        dataKey="mes"
        series={[
          { name: 'activos', color: 'blue.6', label: 'Clientes Activos' },
          { name: 'nuevos', color: 'violet.6', label: 'Nuevos Clientes' }
        ]}
        curveType="linear"
        tickLine="xy"
        gridAxis="xy"
        withXAxis
        withYAxis
        withLegend
        withTooltip
        withDots
        tooltipAnimationDuration={200}
        connectNulls={false}
        strokeDasharray="5 5"
      />
      
      <Group justify="space-between" mt="sm">
        <Text size="sm" c="dimmed">
          Promedio mensual: {avgNewClients} nuevos clientes
        </Text>
        <Text size="sm" c="dimmed">
          Retención: 94.2%
        </Text>
      </Group>
    </Stack>
  </Paper>
);