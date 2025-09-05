import React from 'react';
import { Group, Text, Badge, ActionIcon, Table } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { type CalculationItem } from '../../../hooks/useCalculatorBase';
import { CalculatorActions } from '../types/calculatorTypes';

// Helper component to simplify TableRow logic
const TableActions: React.FC<{
  item: CalculationItem;
  readonly: boolean;
  allowRemoveItems: boolean;
  handleRemoveItem: (id: string) => void;
}> = ({ item, readonly, allowRemoveItems, handleRemoveItem }) => {
  if (readonly || !allowRemoveItems) return null;

  return (
    <Table.Td>
      <Group gap="xs">
        <ActionIcon size="sm" variant="light" color="red" onClick={() => handleRemoveItem(item.id)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Table.Td>
  );
};

export interface TableRowProps {
  item: CalculationItem;
  actions: CalculatorActions;
  readonly: boolean;
  allowEditItems: boolean;
  allowRemoveItems: boolean;
  handleRemoveItem: (id: string) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  item,
  actions,
  readonly,
  allowEditItems,
  allowRemoveItems,
  handleRemoveItem,
}) => {
  const displayValue =
    item.tipo === 'PORCENTAJE' ? `${item.valor}%` : actions.formatValue(item.valor);
  const showActions = !readonly && (allowEditItems || allowRemoveItems);

  return (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {item.concepto}
        </Text>
        {item.formula && (
          <Text size="xs" c="dimmed">
            {item.formula}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Badge size="xs" variant="light">
          {item.tipo || 'FIJO'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{displayValue}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {item.cantidad || 1} {item.unidad || ''}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" fw={500}>
          {actions.formatValue(item.valor * (item.cantidad || 1))}
        </Text>
      </Table.Td>
      {showActions && (
        <TableActions
          item={item}
          readonly={readonly}
          allowRemoveItems={allowRemoveItems}
          handleRemoveItem={handleRemoveItem}
        />
      )}
    </Table.Tr>
  );
};
