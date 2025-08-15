import React from 'react';
import { Card, Stack, Group, Text, Badge, ThemeIcon, Progress } from '@mantine/core';
import { CategorySummary } from './types';

interface CategorySummaryCardProps {
  category: CategorySummary;
  _total: number;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

export const CategorySummaryCard: React.FC<CategorySummaryCardProps> = ({
  category,
  _total,
  formatCurrency,
  formatPercentage,
}) => (
  <Card withBorder>
    <Stack gap="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <ThemeIcon size="sm" color={category.color} variant="light">
            {category.icon}
          </ThemeIcon>
          <Text fw={500} size="sm">
            {category.categoria}
          </Text>
        </Group>
        <Badge size="sm" color={category.color} variant="light">
          {category.items.length} items
        </Badge>
      </Group>

      <Group justify="space-between" align="end">
        <Text size="lg" fw={700} c={category.color}>
          {formatCurrency(category.total)}
        </Text>
        <Badge size="xs" color={category.color} variant="filled">
          {formatPercentage(category.porcentaje)}
        </Badge>
      </Group>

      <Progress value={category.porcentaje} color={category.color} size="xs" />
    </Stack>
  </Card>
);
