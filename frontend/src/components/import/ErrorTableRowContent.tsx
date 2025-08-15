import React from 'react';
import { Group, Text, Badge, Checkbox, Tooltip } from '@mantine/core';
import { IconExclamationCircle, IconAlertCircle } from '@tabler/icons-react';
import { ImportError, CorrectionAction } from '../../hooks/useErrorCorrections';

interface ErrorTableRowContentProps {
  error: ImportError;
  errorKey: string;
  selectedErrors: Set<string>;
  correction: CorrectionAction | undefined;
  onToggleSelection: (errorKey: string, checked: boolean) => void;
}

const getFieldIcon = (field: string): string => {
  if (field.includes('email')) return '@';
  if (field.includes('telefono') || field.includes('phone')) return '📞';
  if (field.includes('fecha') || field.includes('date')) return '📅';
  if (field.includes('nombre') || field.includes('name')) return '👤';
  return '📝';
};

export const ErrorTableRowContent: React.FC<ErrorTableRowContentProps> = ({
  error,
  errorKey,
  selectedErrors,
  correction,
  onToggleSelection,
}) => {
  return (
    <>
      <td>
        <Checkbox
          checked={selectedErrors.has(errorKey)}
          onChange={(e) => onToggleSelection(errorKey, e.currentTarget.checked)}
        />
      </td>
      <td>
        <Badge variant="filled" c="gray">
          {error.row}
        </Badge>
      </td>
      <td>
        <Group gap={4}>
          <Text size="sm">{getFieldIcon(error.field)}</Text>
          <Text size="sm" fw={500}>
            {error.field}
          </Text>
        </Group>
      </td>
      <td>
        <Group gap="xs">
          <Text size="sm" style={{ textDecoration: correction ? 'line-through' : 'none' }}>
            {String(error.value)}
          </Text>
          {correction && (
            <Badge size="sm" c="green" variant="light">
              → {String(correction.newValue)}
            </Badge>
          )}
        </Group>
      </td>
      <td>
        <Group gap={4}>
          <Badge
            color={error.severity === 'error' ? 'red' : 'yellow'}
            leftSection={
              error.severity === 'error' ? (
                <IconExclamationCircle size={12} />
              ) : (
                <IconAlertCircle size={12} />
              )
            }
          >
            {error.error}
          </Badge>
          {error.suggestion && (
            <Tooltip label={`Sugerencia: ${error.suggestion}`}>
              <Badge c="blue" variant="light">
                Sugerencia
              </Badge>
            </Tooltip>
          )}
        </Group>
      </td>
    </>
  );
};
