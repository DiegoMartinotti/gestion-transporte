import React from 'react';
import { Paper, Group, Button } from '@mantine/core';

interface QuickActionsPanelProps {
  recommendedCount: number;
  availableCount: number;
  selectedCount: number;
  onSelectRecommended: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  recommendedCount,
  availableCount,
  selectedCount,
  onSelectRecommended,
  onSelectAll,
  onClearAll,
}) => {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Button
            variant="light"
            size="sm"
            onClick={onSelectRecommended}
            disabled={recommendedCount === 0}
          >
            Seleccionar Recomendadas ({recommendedCount})
          </Button>
          <Button variant="light" size="sm" onClick={onSelectAll}>
            Seleccionar Todas ({availableCount})
          </Button>
          <Button
            variant="light"
            size="sm"
            color="red"
            onClick={onClearAll}
            disabled={selectedCount === 0}
          >
            Limpiar Selección
          </Button>
        </Group>
      </Group>
    </Paper>
  );
};
