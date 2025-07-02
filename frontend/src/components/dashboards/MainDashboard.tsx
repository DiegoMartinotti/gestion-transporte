import { Container, Grid, Stack, Title, Group, Button, Divider } from '@mantine/core';
import { IconRefresh, IconTruck, IconUsers, IconMapPin, IconCurrencyDollar, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { KPICard } from '../cards/KPICard';
import { showNotification } from '@mantine/notifications';

interface DashboardStats {
  vehiculos: {
    total: number;
    activos: number;
    inactivos: number;
    documentosVencidos: number;
  };
  viajes: {
    totalMes: number;
    completados: number;
    enProceso: number;
    facturacionMes: number;
  };
  clientes: {
    total: number;
    activos: number;
    inactivos: number;
    nuevosEsteMes: number;
  };
  sites: {
    total: number;
    conCoordenadas: number;
    sinCoordenadas: number;
  };
  facturacion: {
    mesActual: number;
    mesAnterior: number;
    pendienteCobro: number;
    vencidas: number;
  };
  personal: {
    total: number;
    choferes: number;
    administradores: number;
    documentosVencidos: number;
  };
}

export const MainDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Simulando datos - en producción sería una llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        vehiculos: {
          total: 45,
          activos: 38,
          inactivos: 7,
          documentosVencidos: 3
        },
        viajes: {
          totalMes: 234,
          completados: 189,
          enProceso: 45,
          facturacionMes: 2450000
        },
        clientes: {
          total: 28,
          activos: 25,
          inactivos: 3,
          nuevosEsteMes: 2
        },
        sites: {
          total: 156,
          conCoordenadas: 142,
          sinCoordenadas: 14
        },
        facturacion: {
          mesActual: 2450000,
          mesAnterior: 2180000,
          pendienteCobro: 1250000,
          vencidas: 320000
        },
        personal: {
          total: 52,
          choferes: 38,
          administradores: 14,
          documentosVencidos: 5
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      showNotification({
        title: 'Error',
        message: 'No se pudieron cargar las estadísticas',
        color: 'red'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    showNotification({
      title: 'Actualizado',
      message: 'Dashboard actualizado correctamente',
      color: 'green'
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const calculateTrend = (current: number, previous: number): { trend: 'up' | 'down' | 'neutral', value: string } => {
    if (previous === 0) return { trend: 'neutral' as const, value: '0%' };
    
    const percentage = ((current - previous) / previous) * 100;
    const trend: 'up' | 'down' | 'neutral' = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    
    return {
      trend,
      value: `${Math.abs(percentage).toFixed(1)}%`
    };
  };

  if (loading) {
    return (
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
  }

  if (!stats) return null;

  const facturacionTrend = calculateTrend(stats.facturacion.mesActual, stats.facturacion.mesAnterior);

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2}>Dashboard Principal</Title>
          <Button 
            leftSection={<IconRefresh size={16} />} 
            onClick={handleRefresh}
            loading={refreshing}
            variant="light"
          >
            Actualizar
          </Button>
        </Group>

        {/* Métricas Principales */}
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
                onRefresh={handleRefresh}
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
                onRefresh={handleRefresh}
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
                onRefresh={handleRefresh}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <KPICard
                title="Clientes Activos"
                value={stats.clientes.activos}
                icon={<IconUsers size={20} />}
                color="violet"
                subtitle={`${stats.clientes.nuevosEsteMes} nuevos este mes`}
                onRefresh={handleRefresh}
              />
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Métricas Operativas */}
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
                onRefresh={handleRefresh}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <KPICard
                title="Personal Total"
                value={stats.personal.total}
                icon={<IconUsers size={20} />}
                color="teal"
                subtitle={`${stats.personal.choferes} choferes`}
                onRefresh={handleRefresh}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <KPICard
                title="Viajes en Proceso"
                value={stats.viajes.enProceso}
                icon={<IconClock size={20} />}
                color="yellow"
                subtitle="Requieren seguimiento"
                onRefresh={handleRefresh}
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
                onRefresh={handleRefresh}
              />
            </Grid.Col>
          </Grid>
        </div>

        <Divider />

        {/* Alertas y Documentación */}
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
                onRefresh={handleRefresh}
              />
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <KPICard
                title="Documentos Personal Vencidos"
                value={stats.personal.documentosVencidos}
                icon={<IconAlertTriangle size={20} />}
                color="red"
                subtitle="Requieren renovación urgente"
                onRefresh={handleRefresh}
              />
            </Grid.Col>
          </Grid>
        </div>
      </Stack>
    </Container>
  );
};