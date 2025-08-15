import React from 'react';
import { Group, TextInput, ActionIcon } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

interface ErrorTableRowEditProps {
  editValue: string;
  setEditValue: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ErrorTableRowEdit: React.FC<ErrorTableRowEditProps> = ({
  editValue,
  setEditValue,
  onConfirm,
  onCancel,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Group gap="xs">
      <TextInput
        size="xs"
        value={editValue}
        onChange={(e) => setEditValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{ width: 150 }}
      />
      <ActionIcon size="sm" c="green" onClick={onConfirm}>
        <IconCheck size={14} />
      </ActionIcon>
      <ActionIcon size="sm" c="red" onClick={onCancel}>
        <IconX size={14} />
      </ActionIcon>
    </Group>
  );
};
