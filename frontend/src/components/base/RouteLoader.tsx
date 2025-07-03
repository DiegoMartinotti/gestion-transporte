import { FC } from 'react';
import { Stack, Text, Paper, Group, Skeleton, ThemeIcon } from '@mantine/core';
import { IconRoute } from '@tabler/icons-react';
import LoadingOverlay from './LoadingOverlay';

interface RouteLoaderProps {
  type?: 'skeleton' | 'overlay' | 'minimal';
  message?: string;
  showIcon?: boolean;
}

export function RouteLoader({ 
  type = 'skeleton', 
  message = 'Cargando página...',
  showIcon = true 
}: RouteLoaderProps) {
  switch (type) {
    case 'overlay':
      return <LoadingOverlay loading={true}>Loading...</LoadingOverlay>;
      
    case 'minimal':
      return (
        <Stack align="center" justify="center" h="200px">
          {showIcon && (
            <ThemeIcon size="xl" variant="light">
              <IconRoute size="1.5rem" />
            </ThemeIcon>
          )}
          <Text size="sm" c="dimmed">{message}</Text>
        </Stack>
      );
      
    case 'skeleton':
    default:
      return (
        <Stack gap="md" p="md">
          {/* Header skeleton */}
          <Group justify="space-between">
            <Skeleton height={32} width={200} />
            <Skeleton height={36} width={120} />
          </Group>
          
          {/* Filter skeleton */}
          <Paper p="md" withBorder>
            <Group>
              <Skeleton height={36} width={300} />
              <Skeleton height={36} width={150} />
              <Skeleton height={36} width={150} />
            </Group>
          </Paper>
          
          {/* Content skeleton */}
          <Paper p="md" withBorder>
            <Stack gap="xs">
              {/* Table header */}
              <Group justify="space-between">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={20} width={100} />
                ))}
              </Group>
              
              {/* Table rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <Group key={i} justify="space-between">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} height={16} width={80} />
                  ))}
                </Group>
              ))}
            </Stack>
          </Paper>
        </Stack>
      );
  }
}

export default RouteLoader;