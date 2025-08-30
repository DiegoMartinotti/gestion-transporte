import React from 'react';
import { Paper, Group, Box, Text, Badge, ThemeIcon } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';

interface ReferenceHeaderProps {
  targetEntity: string;
  selectedCount: number;
  totalRecords: number;
}

export const ReferenceHeader: React.FC<ReferenceHeaderProps> = ({
  targetEntity,
  selectedCount,
  totalRecords,
}) => {
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon size="lg" variant="light" color="blue">
            <IconDatabase size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={500} size="sm">
              Hojas de Referencia
            </Text>
            <Text size="xs" c="dimmed">
              Datos existentes para completar formularios de {targetEntity}
            </Text>
          </Box>
        </Group>

        <Group gap="sm">
          <Badge variant="light" color="blue">
            {selectedCount} seleccionadas
          </Badge>
          {totalRecords > 0 && (
            <Badge variant="light" color="green">
              {totalRecords} registros
            </Badge>
          )}
        </Group>
      </Group>
    </Paper>
  );
};
