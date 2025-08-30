import React from 'react';
import { Title, Group, Text, Button, Box } from '@mantine/core';
import { IconCalculator, IconRefresh } from '@tabler/icons-react';
import { CalculatorActions } from '../types/calculatorTypes';

export interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  actions: CalculatorActions;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ title, subtitle, actions }) => (
  <Group justify="space-between" mb="md">
    <Box>
      <Group>
        <IconCalculator size={24} />
        <Title order={3}>{title}</Title>
      </Group>
      {subtitle && (
        <Text size="sm" c="dimmed" mt={4}>
          {subtitle}
        </Text>
      )}
    </Box>
    <Group>
      <Button
        variant="light"
        leftSection={<IconRefresh size={16} />}
        onClick={actions.recalculate}
        size="sm"
      >
        Recalcular
      </Button>
    </Group>
  </Group>
);
