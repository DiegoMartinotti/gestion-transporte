import React from 'react';
import { Grid, Title, Container, Stack, Group, Button } from '@mantine/core';
import { IconRefresh, IconTruck, IconUsers, IconMapPin, IconCurrencyDollar, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { KPICard } from '../cards/KPICard';
import { DashboardStats } from './MainDashboardTypes';
import { calculateTrend } from './MainDashboardHelpers';

export const LoadingDashboard = ({ _onRefresh }: { _onRefresh: () => void }) => (
  <Container size="xl" py="md">
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={2}>Dashboard Principal</Title>
        <Button leftSection={<IconRefresh size={16} />} loading>
          Actualizando...
        </Button>
      </Group>
      
      <Grid>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <KPICard
              title="Cargando..."
              value="..."
              loading={true}
            />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  </Container>
);

interface MainMetricsProps {
  stats: DashboardStats;
  onRefresh: () => void;
}

export const MainMetrics = ({ stats, onRefresh }: MainMetricsProps) => {
  const facturacionTrend = calculateTrend(stats.facturacion.mesActual, stats.facturacion.mesAnterior);

  return (
    <div>
      <Title order={3} mb="md">Métricas Principales</Title>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <KPICard
            title="Facturación Mensual"
            value={stats.facturacion.mesActual}
            previousValue={stats.facturacion.mesAnterior}
            icon={<IconCurrencyDollar size={20} />}
            color="green"
            trend={facturacionTrend.trend}
            trendValue={facturacionTrend.value}
            format="currency"
            onRefresh={onRefresh}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <KPICard
            title="Viajes del Mes"
            value={stats.viajes.totalMes}
            icon={<IconTruck size={20} />}
            color="blue"
            progress={Math.round((stats.viajes.completados / stats.viajes.totalMes) * 100)}
            subtitle={`${stats.viajes.completados} completados`}
            onRefresh={onRefresh}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <KPICard
            title="Vehículos Activos"
            value={stats.vehiculos.activos}
            icon={<IconTruck size={20} />}
            color="cyan"
            progress={Math.round((stats.vehiculos.activos / stats.vehiculos.total) * 100)}
            subtitle={`de ${stats.vehiculos.total} totales`}
            onRefresh={onRefresh}
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <KPICard
            title="Clientes Activos"
            value={stats.clientes.activos}
            icon={<IconUsers size={20} />}
            color="violet"
            subtitle={`${stats.clientes.nuevosEsteMes} nuevos este mes`}
            onRefresh={onRefresh}
          />
        </Grid.Col>
      </Grid>
    </div>
  );
};

interface OperationalMetricsProps {
  stats: DashboardStats;
  onRefresh: () => void;
}

export const OperationalMetrics = ({ stats, onRefresh }: OperationalMetricsProps) => (
  <div>
    <Title order={3} mb="md">Métricas Operativas</Title>
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <KPICard
          title="Sites Registrados"
          value={stats.sites.total}
          icon={<IconMapPin size={20} />}
          color="orange"
          progress={Math.round((stats.sites.conCoordenadas / stats.sites.total) * 100)}
          subtitle={`${stats.sites.conCoordenadas} geocodificados`}
          onRefresh={onRefresh}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <KPICard
          title="Personal Total"
          value={stats.personal.total}
          icon={<IconUsers size={20} />}
          color="teal"
          subtitle={`${stats.personal.choferes} choferes`}
          onRefresh={onRefresh}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <KPICard
          title="Viajes en Proceso"
          value={stats.viajes.enProceso}
          icon={<IconClock size={20} />}
          color="yellow"
          subtitle="Requieren seguimiento"
          onRefresh={onRefresh}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
        <KPICard
          title="Pendiente de Cobro"
          value={stats.facturacion.pendienteCobro}
          icon={<IconCurrencyDollar size={20} />}
          color="red"
          format="currency"
          subtitle={`${stats.facturacion.vencidas.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} vencidas`}
          onRefresh={onRefresh}
        />
      </Grid.Col>
    </Grid>
  </div>
);

interface DocumentAlertsProps {
  stats: DashboardStats;
  onRefresh: () => void;
}

export const DocumentAlerts = ({ stats, onRefresh }: DocumentAlertsProps) => (
  <div>
    <Title order={3} mb="md">Alertas de Documentación</Title>
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <KPICard
          title="Documentos Vehículos Vencidos"
          value={stats.vehiculos.documentosVencidos}
          icon={<IconAlertTriangle size={20} />}
          color="red"
          subtitle="Requieren renovación urgente"
          onRefresh={onRefresh}
        />
      </Grid.Col>
      
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <KPICard
          title="Documentos Personal Vencidos"
          value={stats.personal.documentosVencidos}
          icon={<IconAlertTriangle size={20} />}
          color="red"
          subtitle="Requieren renovación urgente"
          onRefresh={onRefresh}
        />
      </Grid.Col>
    </Grid>
  </div>
);

interface DashboardHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export const DashboardHeader = ({ onRefresh, refreshing }: DashboardHeaderProps) => (
  <Group justify="space-between">
    <Title order={2}>Dashboard Principal</Title>
    <Button 
      leftSection={<IconRefresh size={16} />} 
      onClick={onRefresh}
      loading={refreshing}
      variant="light"
    >
      Actualizar
    </Button>
  </Group>
);