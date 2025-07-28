import React from 'react';
import {
  Card,
  Title,
  Group,
  Button,
  Stack,
  Paper,
  Text,
  ActionIcon,
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface DynamicListFieldProps<T = any> {
  title: string;
  form: UseFormReturnType<any>;
  path: string;
  initialItem: T;
  renderFields: (item: T, index: number, form: UseFormReturnType<any>) => React.ReactNode;
  minItems?: number;
  maxItems?: number;
  canRemove?: (index: number) => boolean;
  itemLabel?: (index: number) => string;
  addButtonText?: string;
  validation?: Record<string, (value: any) => string | null>;
}

export default function DynamicListField<T = any>({
  title,
  form,
  path,
  initialItem,
  renderFields,
  minItems = 0,
  maxItems,
  canRemove,
  itemLabel,
  addButtonText,
  validation
}: DynamicListFieldProps<T>) {
  const items = form.getValues()[path] as T[] || [];

  const addItem = () => {
    if (maxItems && items.length >= maxItems) return;
    form.insertListItem(path, initialItem);
  };

  const removeItem = (index: number) => {
    if (items.length <= minItems) return;
    if (canRemove && !canRemove(index)) return;
    form.removeListItem(path, index);
  };

  const getItemLabel = (index: number) => {
    if (itemLabel) return itemLabel(index);
    return `${title.slice(0, -1)} ${index + 1}`;
  };

  const getAddButtonText = () => {
    if (addButtonText) return addButtonText;
    return `Agregar ${title.slice(0, -1)}`;
  };

  const canAddMore = !maxItems || items.length < maxItems;
  const canRemoveItem = (index: number) => {
    if (items.length <= minItems) return false;
    if (canRemove && !canRemove(index)) return false;
    return true;
  };

  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>{title}</Title>
        {canAddMore && (
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={addItem}
          >
            {getAddButtonText()}
          </Button>
        )}
      </Group>
      
      <Stack gap="sm">
        {items.map((item, index) => (
          <Paper key={index} p="sm" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>{getItemLabel(index)}</Text>
              {canRemoveItem(index) && (
                <ActionIcon
                  color="red"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              )}
            </Group>
            {renderFields(item, index, form)}
          </Paper>
        ))}
        
        {items.length === 0 && (
          <Text c="dimmed" ta="center" py="md">
            No hay {title.toLowerCase()} agregados
          </Text>
        )}
      </Stack>
    </Card>
  );
}