import React from 'react';
import { Text, ScrollArea, Table, Group, Badge, Stack } from '@mantine/core';
import type { ReferenceEntity } from '../ReferenceDataSheets';

interface EntityPreviewProps {
  entity: ReferenceEntity;
}

export const EntityPreview: React.FC<EntityPreviewProps> = ({ entity }) => {
  if (entity.data.length === 0) return null;

  return (
    <Stack gap="xs">
      <Text size="xs" fw={500} c="dimmed">
        Campos disponibles:
      </Text>
      <Group gap="xs">
        {entity.fields
          .filter((f) => f.includeInReference !== false)
          .map((field) => (
            <Badge
              key={field.key}
              size="xs"
              variant="outline"
              color={field.isPrimary ? 'blue' : 'gray'}
            >
              {field.label}
              {field.isPrimary && ' (ID)'}
            </Badge>
          ))}
      </Group>

      <Text size="xs" fw={500} c="dimmed" mt="xs">
        Vista previa:
      </Text>
      <ScrollArea h={100}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {entity.fields
                .filter((f) => f.includeInReference !== false)
                .slice(0, 3)
                .map((field) => (
                  <Table.Th key={field.key}>{field.label}</Table.Th>
                ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entity.data.slice(0, 3).map((item, index) => (
              <Table.Tr key={index}>
                {entity.fields
                  .filter((f) => f.includeInReference !== false)
                  .slice(0, 3)
                  .map((field) => (
                    <Table.Td key={field.key}>
                      {String(item[field.key] || '').slice(0, 20)}
                      {String(item[field.key] || '').length > 20 && '...'}
                    </Table.Td>
                  ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  );
};
