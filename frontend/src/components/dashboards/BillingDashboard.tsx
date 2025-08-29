import React, { useState, useEffect } from 'react';
import { 
  Paper, Title, Grid, Group, Select, Button
} from '@mantine/core';
import { IconDashboard } from '@tabler/icons-react';
import { MetricaFinanciera, TopCliente, TendenciaCobranza, AlertaCobranza, ConfiguracionDashboard } from './BillingDashboardTypes';
import { 
  generateMockMetricas, 
  generateMockTopClientes, 
  generateMockTendencias, 
  generateMockAlertas 
} from './BillingDashboardHelpers';
import { 
  MetricasCards, 
  AlertasComponent, 
  EficienciaCobranza, 
  TopClientesTable, 
  TendenciasTable 
} from './BillingDashboardComponents';

export const BillingDashboard: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricaFinanciera | null>(null);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaCobranza[]>([]);
  const [alertas, setAlertas] = useState<AlertaCobranza[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionDashboard>({
    periodoAnalisis: 'mes',
    metaCobranzaMensual: 5000000
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatosDashboard();
  }, [configuracion]);

  const cargarDatosDashboard = () => {
    setLoading(true);
    
    // Simular carga de datos
    setTimeout(() => {
      setMetricas(generateMockMetricas());
      setTopClientes(generateMockTopClientes());
      setTendencias(generateMockTendencias());
      setAlertas(generateMockAlertas());
      setLoading(false);
    }, 1000);
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconDashboard size={20} />
          <Title order={4}>Dashboard de Facturación</Title>
        </Group>
        <Group gap="xs">
          <Select
            value={configuracion.periodoAnalisis}
            onChange={(value) => setConfiguracion({...configuracion, periodoAnalisis: value as ConfiguracionDashboard['periodoAnalisis']})}
            data={[
              { value: 'mes', label: 'Último Mes' },
              { value: 'trimestre', label: 'Último Trimestre' },
              { value: 'semestre', label: 'Último Semestre' },
              { value: 'anio', label: 'Último Año' }
            ]}
            size="sm"
          />
          <Button 
            variant="light" 
            size="sm"
            onClick={cargarDatosDashboard}
            loading={loading}
          >
            Actualizar
          </Button>
        </Group>
      </Group>

      {/* Métricas Principales */}
      {metricas && (
        <MetricasCards 
          metricas={metricas} 
          tendencias={tendencias} 
          configuracion={configuracion} 
        />
      )}

      <Grid>
        {/* Alertas y Notificaciones */}
        <Grid.Col span={6}>
          <AlertasComponent alertas={alertas} />
        </Grid.Col>

        {/* Eficiencia de Cobranza */}
        <Grid.Col span={6}>
          {metricas && <EficienciaCobranza metricas={metricas} />}
        </Grid.Col>
      </Grid>

      {/* Top Clientes con Deuda */}
      <TopClientesTable topClientes={topClientes} />

      {/* Tendencias Mensuales */}
      <TendenciasTable tendencias={tendencias} />
    </Paper>
  );
};