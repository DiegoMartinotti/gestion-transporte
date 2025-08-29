import { Container, Stack, Divider } from '@mantine/core';
import { useState, useEffect } from 'react';
import { showNotification } from '@mantine/notifications';
import { DashboardStats } from './MainDashboardTypes';
import { generateMockStats } from './MainDashboardHelpers';
import { 
  LoadingDashboard,
  MainMetrics,
  OperationalMetrics,
  DocumentAlerts,
  DashboardHeader
} from './MainDashboardComponents';

export const MainDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // Simulando datos - en producción sería una llamada real a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(generateMockStats());
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

  if (loading) {
    return <LoadingDashboard _onRefresh={handleRefresh} />;
  }

  if (!stats) return null;

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <DashboardHeader onRefresh={handleRefresh} refreshing={refreshing} />

        {/* Métricas Principales */}
        <MainMetrics stats={stats} onRefresh={handleRefresh} />

        <Divider />

        {/* Métricas Operativas */}
        <OperationalMetrics stats={stats} onRefresh={handleRefresh} />

        <Divider />

        {/* Alertas y Documentación */}
        <DocumentAlerts stats={stats} onRefresh={handleRefresh} />
      </Stack>
    </Container>
  );
};