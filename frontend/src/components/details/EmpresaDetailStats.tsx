import { Grid, Card, Group, Stack, Title, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconTruck, IconUsers, IconPlus } from '@tabler/icons-react';
import { Empresa } from '../../types';

interface EmpresaDetailStatsProps {
  empresa: Empresa;
  vehiculosCount: number;
  personalCount: number;
  loadingStats: boolean;
  onCreateVehiculo?: (empresa: Empresa) => void;
  onCreatePersonal?: (empresa: Empresa) => void;
  onViewVehiculos?: (empresa: Empresa) => void;
  onViewPersonal?: (empresa: Empresa) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  loading: boolean;
  description: string;
  onView?: () => void;
  onCreate?: () => void;
  viewIcon: React.ReactNode;
}

const StatCard = ({
  icon,
  title,
  count,
  loading,
  description,
  onView,
  onCreate,
  viewIcon,
}: StatCardProps) => (
  <Card p="lg" withBorder>
    <Group justify="space-between" align="flex-start">
      <Stack gap="xs">
        <Group gap="sm">
          {icon}
          <Title order={4}>{title}</Title>
        </Group>

        <Text size="xl" fw={700}>
          {loading ? '...' : count}
        </Text>

        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>

      <Group gap="xs">
        {onView && (
          <Tooltip label={`Ver todos los ${title.toLowerCase()}`}>
            <ActionIcon variant="light" onClick={onView}>
              {viewIcon}
            </ActionIcon>
          </Tooltip>
        )}

        {onCreate && (
          <Tooltip label={`Crear nuevo ${title.toLowerCase().slice(0, -1)}`}>
            <ActionIcon variant="light" color="green" onClick={onCreate}>
              <IconPlus size="1rem" />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  </Card>
);

export function EmpresaDetailStats({
  empresa,
  vehiculosCount,
  personalCount,
  loadingStats,
  onCreateVehiculo,
  onCreatePersonal,
  onViewVehiculos,
  onViewPersonal,
}: EmpresaDetailStatsProps) {
  return (
    <Grid>
      <Grid.Col span={6}>
        <StatCard
          icon={<IconTruck size="1.5rem" color="blue" />}
          title="Vehículos"
          count={vehiculosCount}
          loading={loadingStats}
          description="Flota de vehículos"
          onView={onViewVehiculos ? () => onViewVehiculos(empresa) : undefined}
          onCreate={onCreateVehiculo ? () => onCreateVehiculo(empresa) : undefined}
          viewIcon={<IconTruck size="1rem" />}
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <StatCard
          icon={<IconUsers size="1.5rem" color="green" />}
          title="Personal"
          count={personalCount}
          loading={loadingStats}
          description="Empleados registrados"
          onView={onViewPersonal ? () => onViewPersonal(empresa) : undefined}
          onCreate={onCreatePersonal ? () => onCreatePersonal(empresa) : undefined}
          viewIcon={<IconUsers size="1rem" />}
        />
      </Grid.Col>
    </Grid>
  );
}
