import React from 'react';
import { Card, Title, Group, Text, Progress, ThemeIcon } from '@mantine/core';

interface DocumentStatsProps {
  stats: {
    total: number;
    expired: number;
    expiring: number;
    valid: number;
  };
  filteredCount: number;
  totalCount: number;
}

export const DocumentStats: React.FC<DocumentStatsProps> = ({
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
