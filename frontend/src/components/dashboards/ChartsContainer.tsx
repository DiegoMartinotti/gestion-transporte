import { SimpleGrid } from '@mantine/core';
import { useState, useMemo, useCallback } from 'react';
import { ChartsData, generateMockChartsData, calculateClientStats } from './ChartsContainerHelpers';
import { LoadingCharts, FacturacionChart, ViajesChart, VehiculosChart, ClientesChart } from './ChartsContainerComponents';

interface ChartsContainerProps {
  data?: ChartsData;
  loading?: boolean;
}

export const ChartsContainer = ({ data, loading = false }: ChartsContainerProps) => {
  const [facturacionPeriod, setFacturacionPeriod] = useState('6m');
  const [viajesPeriod, setViajesPeriod] = useState('3m');

  // Memoize mock data to avoid recreating it on every render
  const mockData = useMemo(() => generateMockChartsData(), []);

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
  const clientStats = useMemo(() => calculateClientStats(chartData.clientes), [chartData.clientes]);

  if (loading) {
    return <LoadingCharts />;
  }

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      <FacturacionChart
        data={chartData.facturacion}
        period={facturacionPeriod}
        onPeriodChange={setFacturacionPeriod}
        currencyFormatter={currencyFormatter}
      />

      <ViajesChart
        data={chartData.viajes}
        period={viajesPeriod}
        onPeriodChange={setViajesPeriod}
      />

      <VehiculosChart data={chartData.vehiculos} />

      <ClientesChart 
        data={chartData.clientes} 
        avgNewClients={clientStats.avgNewClients} 
      />
    </SimpleGrid>
  );
};