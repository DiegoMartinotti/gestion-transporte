import { Paper, Stack, Title, Group, SegmentedControl, Text, SimpleGrid } from '@mantine/core';
import { AreaChart, BarChart, LineChart, DonutChart } from '@mantine/charts';
import { useState, useMemo, useCallback } from 'react';

interface ChartsContainerProps {
  data?: {
    facturacion: Array<{ mes: string; monto: number; year: number }>;
    viajes: Array<{ mes: string; completados: number; pendientes: number; cancelados: number }>;
    vehiculos: Array<{ name: string; value: number; color: string }>;
    clientes: Array<{ mes: string; nuevos: number; activos: number }>;
  };
  loading?: boolean;
}

export const ChartsContainer = ({ data, loading = false }: ChartsContainerProps) => {
  const [facturacionPeriod, setFacturacionPeriod] = useState('6m');
  const [viajesPeriod, setViajesPeriod] = useState('3m');

  // Memoize mock data to avoid recreating it on every render
  const mockData = useMemo(() => ({
    facturacion: [
      { mes: 'Ene', monto: 1850000, year: 2024 },
      { mes: 'Feb', monto: 2100000, year: 2024 },
      { mes: 'Mar', monto: 1950000, year: 2024 },
      { mes: 'Abr', monto: 2300000, year: 2024 },
      { mes: 'May', monto: 2150000, year: 2024 },
      { mes: 'Jun', monto: 2450000, year: 2024 }
    ],
    viajes: [
      { mes: 'Ene', completados: 145, pendientes: 23, cancelados: 8 },
      { mes: 'Feb', completados: 167, pendientes: 18, cancelados: 5 },
      { mes: 'Mar', completados: 189, pendientes: 25, cancelados: 12 },
      { mes: 'Abr', completados: 201, pendientes: 31, cancelados: 9 },
      { mes: 'May', completados: 178, pendientes: 19, cancelados: 7 },
      { mes: 'Jun', completados: 234, pendientes: 28, cancelados: 11 }
    ],
    vehiculos: [
      { name: 'Camiones', value: 25, color: 'blue' },
      { name: 'Camionetas', value: 12, color: 'cyan' },
      { name: 'Utilitarios', value: 8, color: 'orange' },
      { name: 'Mantenimiento', value: 3, color: 'red' }
    ],
    clientes: [
      { mes: 'Ene', nuevos: 2, activos: 22 },
      { mes: 'Feb', nuevos: 1, activos: 23 },
      { mes: 'Mar', nuevos: 3, activos: 25 },
      { mes: 'Abr', nuevos: 0, activos: 24 },
      { mes: 'May', nuevos: 2, activos: 26 },
      { mes: 'Jun', nuevos: 1, activos: 25 }
    ]
  }), []); // Empty dependency array since mock data is static

  // Memoize chart data to avoid unnecessary recalculation
  const chartData = useMemo(() => data || mockData, [data, mockData]);

  // Memoize currency formatter to avoid recreating the function
  const currencyFormatter = useCallback((value: number) => 
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value),
    []
  );

  // Memoize calculated values
  const clientStats = useMemo(() => {
    const avgNewClients = Math.round(
      chartData.clientes.reduce((acc, item) => acc + item.nuevos, 0) / chartData.clientes.length
    );
    return { avgNewClients };
  }, [chartData.clientes]);

  if (loading) {
    return (
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
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      {/* Facturación Mensual */}
      <Paper p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Facturación Mensual</Title>
            <SegmentedControl
              size="xs"
              value={facturacionPeriod}
              onChange={setFacturacionPeriod}
              data={[
                { label: '3M', value: '3m' },
                { label: '6M', value: '6m' },
                { label: '1A', value: '1y' }
              ]}
            />
          </Group>
          
          <AreaChart
            h={300}
            data={chartData.facturacion}
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

      {/* Estado de Viajes */}
      <Paper p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Estado de Viajes</Title>
            <SegmentedControl
              size="xs"
              value={viajesPeriod}
              onChange={setViajesPeriod}
              data={[
                { label: '3M', value: '3m' },
                { label: '6M', value: '6m' },
                { label: '1A', value: '1y' }
              ]}
            />
          </Group>
          
          <BarChart
            h={300}
            data={chartData.viajes}
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

      {/* Distribución de Vehículos */}
      <Paper p="md" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Distribución de Vehículos</Title>
          
          <DonutChart
            h={300}
            data={chartData.vehiculos}
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

      {/* Evolución de Clientes */}
      <Paper p="md" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Evolución de Clientes</Title>
          
          <LineChart
            h={300}
            data={chartData.clientes}
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
              Promedio mensual: {clientStats.avgNewClients} nuevos clientes
            </Text>
            <Text size="sm" c="dimmed">
              Retención: 94.2%
            </Text>
          </Group>
        </Stack>
      </Paper>
    </SimpleGrid>
  );
};