import React from 'react';
import { Card, Group, Text, Title, Progress, ThemeIcon } from '@mantine/core';
import type { DocumentStats } from './hooks/useDocumentStats';

interface StatisticsCardProps {
  stats: DocumentStats;
  filteredCount: number;
  totalCount: number;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  stats,
  filteredCount,
  totalCount,
}) => {
  return (
    <Card withBorder p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Estado de Documentación</Title>
        <Text size="sm" color="dimmed">
          {filteredCount} de {totalCount} documentos
        </Text>
      </Group>

      {/* Progress component no longer supports sections in Mantine 7 */}
      <Progress size="lg" value={(stats.valid / stats.total) * 100} color="green" />

      <Group gap="xl" mt="md">
        <Group gap="xs">
          <ThemeIcon size="sm" color="green" variant="light">
            <span style={{ fontSize: '12px' }}>{stats.valid}</span>
          </ThemeIcon>
          <Text size="sm">Vigentes</Text>
        </Group>
        <Group gap="xs">
          <ThemeIcon size="sm" color="yellow" variant="light">
            <span style={{ fontSize: '12px' }}>{stats.expiring}</span>
          </ThemeIcon>
          <Text size="sm">Por Vencer</Text>
        </Group>
        <Group gap="xs">
          <ThemeIcon size="sm" color="red" variant="light">
            <span style={{ fontSize: '12px' }}>{stats.expired}</span>
          </ThemeIcon>
          <Text size="sm">Vencidos</Text>
        </Group>
      </Group>
    </Card>
  );
};
