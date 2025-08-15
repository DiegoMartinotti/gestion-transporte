import { Grid, Card, Group, Stack, Title, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconMapSearch, IconRoute, IconPlus } from '@tabler/icons-react';
import { Cliente } from '../../types';

interface ClienteDetailStatsProps {
  cliente: Cliente;
  sitesCount: number;
  tramosCount: number;
  loadingStats: boolean;
  onCreateSite?: (cliente: Cliente) => void;
  onCreateTramo?: (cliente: Cliente) => void;
  onViewSites?: (cliente: Cliente) => void;
  onViewTramos?: (cliente: Cliente) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  loading: boolean;
  description: string;
  onView?: () => void;
  onCreate?: () => void;
  color: string;
}

const StatCard = ({
  icon,
  title,
  count,
  loading,
  description,
  onView,
  onCreate,
  color: _color,
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
              {title === 'Sites' ? <IconMapSearch size="1rem" /> : <IconRoute size="1rem" />}
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

export function ClienteDetailStats({
  cliente,
  sitesCount,
  tramosCount,
  loadingStats,
  onCreateSite,
  onCreateTramo,
  onViewSites,
  onViewTramos,
}: ClienteDetailStatsProps) {
  return (
    <Grid>
      <Grid.Col span={6}>
        <StatCard
          icon={<IconMapSearch size="1.5rem" color="blue" />}
          title="Sites"
          count={sitesCount}
          loading={loadingStats}
          description="Ubicaciones registradas"
          onView={onViewSites ? () => onViewSites(cliente) : undefined}
          onCreate={onCreateSite ? () => onCreateSite(cliente) : undefined}
          color="blue"
        />
      </Grid.Col>

      <Grid.Col span={6}>
        <StatCard
          icon={<IconRoute size="1.5rem" color="green" />}
          title="Tramos"
          count={tramosCount}
          loading={loadingStats}
          description="Rutas configuradas"
          onView={onViewTramos ? () => onViewTramos(cliente) : undefined}
          onCreate={onCreateTramo ? () => onCreateTramo(cliente) : undefined}
          color="green"
        />
      </Grid.Col>
    </Grid>
  );
}
