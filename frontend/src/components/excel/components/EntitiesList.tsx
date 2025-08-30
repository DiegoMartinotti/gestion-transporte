import React from 'react';
import { Stack, Paper, Text } from '@mantine/core';
import { EntityCard } from './EntityCard';
import type { ReferenceEntity } from '../ReferenceDataSheets';

interface EntitiesListProps {
  availableEntities: ReferenceEntity[];
  selectedEntities: string[];
  expandedEntities: Record<string, boolean>;
  onToggleSelection: (entityId: string) => void;
  onToggleExpansion: (entityId: string) => void;
  onRefresh?: (entityId: string) => void;
}

export const EntitiesList: React.FC<EntitiesListProps> = ({
  availableEntities,
  selectedEntities,
  expandedEntities,
  onToggleSelection,
  onToggleExpansion,
  onRefresh,
}) => {
  return (
    <Paper p="md" withBorder>
      <Text fw={500} size="sm" mb="md">
        Entidades Disponibles
      </Text>

      <Stack gap="sm">
        {availableEntities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isSelected={selectedEntities.includes(entity.id)}
            isExpanded={expandedEntities[entity.id] || false}
            onToggleSelection={onToggleSelection}
            onToggleExpansion={onToggleExpansion}
            onRefresh={onRefresh}
          />
        ))}
      </Stack>
    </Paper>
  );
};
