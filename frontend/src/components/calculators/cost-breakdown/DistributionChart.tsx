import React from 'react';
import { Card, Stack, Title, RingProgress, Center, Text, Group, ThemeIcon } from '@mantine/core';
import { CategorySummary } from './types';

interface DistributionChartProps {
  categorySummaries: CategorySummary[];
  total: number;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  categorySummaries,
  total,
  formatCurrency,
  formatPercentage,
}) => (
  <Card withBorder h="100%">
    <Stack align="center">
      <Title order={5}>Distribución</Title>

      <RingProgress
        size={160}
        thickness={16}
        sections={categorySummaries.map((category) => ({
          value: category.porcentaje,
          color: category.color,
        }))}
        label={
          <Center>
            <Stack align="center" gap="xs">
              <Text size="xs" c="dimmed">
                Total
              </Text>
              <Text size="sm" fw={700}>
                {formatCurrency(total)}
              </Text>
            </Stack>
          </Center>
        }
      />

      <Stack gap="xs" w="100%">
        {categorySummaries.map((category) => (
          <Group key={category.categoria} justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="sm" color={category.color} variant="light">
                {category.icon}
              </ThemeIcon>
              <Text size="xs">{category.categoria}</Text>
            </Group>
            <Text size="xs" fw={500}>
              {formatPercentage(category.porcentaje)}
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  </Card>
);
