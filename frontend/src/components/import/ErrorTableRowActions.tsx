import React from 'react';
import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconEdit, IconWand, IconX, IconTrash } from '@tabler/icons-react';
import { ImportError } from '../../hooks/useErrorCorrections';

interface ErrorTableRowActionsProps {
  error: ImportError;
  isEditing: boolean;
  onEdit: () => void;
  onApplySuggestion: (error: ImportError) => void;
  onSkipRow: (row: number) => void;
  onDeleteRow: (row: number) => void;
}

export const ErrorTableRowActions: React.FC<ErrorTableRowActionsProps> = ({
  error,
  isEditing,
  onEdit,
  onApplySuggestion,
  onSkipRow,
  onDeleteRow,
}) => {
  return (
    <Group gap={4}>
      <Tooltip label="Editar valor">
        <ActionIcon size="sm" onClick={onEdit} disabled={isEditing}>
          <IconEdit size={14} />
        </ActionIcon>
      </Tooltip>

      {error.suggestion && (
        <Tooltip label="Aplicar sugerencia">
          <ActionIcon size="sm" c="blue" onClick={() => onApplySuggestion(error)}>
            <IconWand size={14} />
          </ActionIcon>
        </Tooltip>
      )}

      <Tooltip label="Omitir fila">
        <ActionIcon size="sm" c="gray" onClick={() => onSkipRow(error.row)}>
          <IconX size={14} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Eliminar fila">
        <ActionIcon size="sm" c="red" onClick={() => onDeleteRow(error.row)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};
