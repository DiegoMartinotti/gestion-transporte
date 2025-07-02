import { Container, Stack, Title, Group, SimpleGrid, Divider } from '@mantine/core';
import { MainDashboard } from '../components/dashboards/MainDashboard';
import { ChartsContainer } from '../components/dashboards/ChartsContainer';
import { QuickActions } from '../components/dashboards/QuickActions';
import { RecentActivity } from '../components/dashboards/RecentActivity';

export default function DashboardComplete() {
  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Dashboard Principal con KPI Cards */}
        <MainDashboard />
        
        <Divider size="md" />
        
        {/* Gráficos y Métricas Visuales */}
        <div>
          <Title order={3} mb="md">Análisis Visual</Title>
          <ChartsContainer />
        </div>
        
        <Divider size="md" />
        
        {/* Acciones Rápidas y Actividad Reciente */}
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          <div>
            <Title order={3} mb="md">Acciones Rápidas</Title>
            <QuickActions />
          </div>
          
          <div>
            <Title order={3} mb="md">Actividad Reciente</Title>
            <RecentActivity limit={8} showHeader={false} height={600} />
          </div>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}