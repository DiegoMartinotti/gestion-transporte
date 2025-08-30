import React from 'react';
import {
  Paper,
  Group,
  Box,
  Text,
  Badge,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Collapse,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconRefresh } from '@tabler/icons-react';
import type { ReferenceEntity } from '../ReferenceDataSheets';
import { EntityPreview } from './EntityPreview';

interface EntityCardProps {
  entity: ReferenceEntity;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelection: (entityId: string) => void;
  onToggleExpansion: (entityId: string) => void;
  onRefresh?: (entityId: string) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  isSelected,
  isExpanded,
  onToggleSelection,
  onToggleExpansion,
  onRefresh,
}) => {
  const getEntityStatus = (entity: ReferenceEntity) => {
    if (entity.isLoading) return { color: 'blue', text: 'Cargando...' };
    if (entity.data.length === 0) return { color: 'gray', text: 'Sin datos' };
    if (entity.requiredFor?.includes('datos')) return { color: 'orange', text: 'Recomendado' };
    return { color: 'green', text: 'Disponible' };
  };

  const status = getEntityStatus(entity);

  return (
    <Paper
      key={entity.id}
      p="sm"
      withBorder={isSelected}
      bg={isSelected ? 'var(--mantine-color-blue-0)' : undefined}
    >
      <Group justify="space-between" align="flex-start">
        <Group gap="sm" style={{ flex: 1 }}>
          <ActionIcon variant="subtle" size="sm" onClick={() => onToggleExpansion(entity.id)}>
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </ActionIcon>

          <Box style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text fw={500} size="sm">
                {entity.name}
              </Text>
              <Badge size="xs" color={status.color} variant="light">
                {status.text}
              </Badge>
              <Badge size="xs" variant="outline">
                {entity.data.length} registros
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {entity.description}
            </Text>
            {entity.lastUpdated && (
              <Text size="xs" c="dimmed">
                Actualizado: {entity.lastUpdated.toLocaleString()}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="xs">
          {onRefresh && (
            <Tooltip label="Actualizar datos">
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => onRefresh(entity.id)}
                loading={entity.isLoading}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          <Button
            variant={isSelected ? 'filled' : 'light'}
            size="sm"
            onClick={() => onToggleSelection(entity.id)}
            disabled={entity.data.length === 0}
          >
            {isSelected ? 'Incluida' : 'Incluir'}
          </Button>
        </Group>
      </Group>

      <Collapse in={isExpanded}>
        <Divider my="sm" />
        <EntityPreview entity={entity} />
      </Collapse>
    </Paper>
  );
};
