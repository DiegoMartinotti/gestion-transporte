import { Paper, Text, Group, Stack, RingProgress, ThemeIcon, ActionIcon } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus, IconRefresh } from '@tabler/icons-react';
import { ReactNode } from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  progress?: number;
  loading?: boolean;
  onRefresh?: () => void;
  subtitle?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export const KPICard = ({
  title,
  value,
  previousValue,
  icon,
  color = 'blue',
  trend,
  trendValue,
  progress,
  loading = false,
  onRefresh,
  subtitle,
  format = 'number'
}: KPICardProps) => {
  const formatValue = (val: string | number) => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(numValue);
      case 'percentage':
        return `${numValue}%`;
      default:
        return new Intl.NumberFormat('es-AR').format(numValue);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp size={16} color="green" />;
      case 'down':
        return <IconTrendingDown size={16} color="red" />;
      default:
        return <IconMinus size={16} color="gray" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'green';
      case 'down':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          {icon && (
            <ThemeIcon size="lg" radius="md" color={color} variant="light">
              {icon}
            </ThemeIcon>
          )}
          <Stack gap={0}>
            <Text size="sm" c="dimmed" fw={500}>
              {title}
            </Text>
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
        </Group>
        {onRefresh && (
          <ActionIcon 
            variant="subtle" 
            size="sm" 
            onClick={onRefresh}
            loading={loading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>

      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Text size="xl" fw={700} c={loading ? 'dimmed' : undefined}>
            {loading ? '...' : formatValue(value)}
          </Text>
          
          {(trend || trendValue) && !loading && (
            <Group gap={4}>
              {getTrendIcon()}
              <Text size="sm" c={getTrendColor()} fw={500}>
                {trendValue}
              </Text>
              {previousValue && (
                <Text size="xs" c="dimmed">
                  vs {formatValue(previousValue)}
                </Text>
              )}
            </Group>
          )}
        </Stack>

        {progress !== undefined && !loading && (
          <RingProgress
            size={60}
            thickness={6}
            sections={[{ value: progress, color }]}
            label={
              <Text size="xs" ta="center" fw={700}>
                {progress}%
              </Text>
            }
          />
        )}
      </Group>
    </Paper>
  );
};