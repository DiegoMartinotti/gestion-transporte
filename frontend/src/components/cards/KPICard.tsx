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

const formatValue = (val: string | number, format: 'number' | 'currency' | 'percentage') => {
  const numValue = typeof val === 'string' ? parseFloat(val) : val;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(numValue);
    case 'percentage':
      return `${numValue}%`;
    default:
      return new Intl.NumberFormat('es-AR').format(numValue);
  }
};

const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return <IconTrendingUp size={16} color="green" />;
    case 'down':
      return <IconTrendingDown size={16} color="red" />;
    default:
      return <IconMinus size={16} color="gray" />;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return 'green';
    case 'down':
      return 'red';
    default:
      return 'gray';
  }
};

const renderTrendSection = (
  showTrend: boolean,
  trend?: 'up' | 'down' | 'neutral',
  trendValue?: string,
  hasPreviousValue?: boolean,
  previousValue?: string | number,
  format?: 'number' | 'currency' | 'percentage'
) => {
  if (!showTrend) return null;

  return (
    <Group gap={4}>
      {getTrendIcon(trend)}
      <Text size="sm" c={getTrendColor(trend)} fw={500}>
        {trendValue}
      </Text>
      {hasPreviousValue && previousValue && (
        <Text size="xs" c="dimmed">
          vs {formatValue(previousValue, format || 'number')}
        </Text>
      )}
    </Group>
  );
};

const renderProgressSection = (showProgress: boolean, progress?: number, color?: string) => {
  if (!showProgress || progress === undefined) return null;

  return (
    <RingProgress
      size={60}
      thickness={6}
      sections={[{ value: progress, color: color || 'blue' }]}
      label={
        <Text size="xs" ta="center" fw={700}>
          {progress}%
        </Text>
      }
    />
  );
};

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
  format = 'number',
}: KPICardProps) => {
  const hasIcon = Boolean(icon);
  const hasSubtitle = Boolean(subtitle);
  const hasRefresh = Boolean(onRefresh);
  const showTrend = Boolean((trend || trendValue) && !loading);
  const hasPreviousValue = Boolean(previousValue);
  const showProgress = progress !== undefined && !loading;
  const displayValue = loading ? '...' : formatValue(value, format);
  const textColor = loading ? 'dimmed' : undefined;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          {hasIcon && (
            <ThemeIcon size="lg" radius="md" color={color} variant="light">
              {icon}
            </ThemeIcon>
          )}
          <Stack gap={0}>
            <Text size="sm" c="dimmed" fw={500}>
              {title}
            </Text>
            {hasSubtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
        </Group>
        {hasRefresh && (
          <ActionIcon variant="subtle" size="sm" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>

      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Text size="xl" fw={700} c={textColor}>
            {displayValue}
          </Text>

          {renderTrendSection(
            showTrend,
            trend,
            trendValue,
            hasPreviousValue,
            previousValue,
            format
          )}
        </Stack>

        {renderProgressSection(showProgress, progress, color)}
      </Group>
    </Paper>
  );
};
