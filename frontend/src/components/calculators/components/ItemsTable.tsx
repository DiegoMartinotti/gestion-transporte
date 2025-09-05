import React from 'react';
import { Group, Text, ActionIcon, Table, Card, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { type CalculationItem } from '../../../hooks/useCalculatorBase';
import { CalculatorState, CalculatorActions } from '../types/calculatorTypes';
import { TableRow } from './TableRow';

export interface ItemsTableProps {
  state: CalculatorState;
  actions: CalculatorActions;
  readonly: boolean;
  allowEditItems: boolean;
  allowRemoveItems: boolean;
  desgloseOpened: boolean;
  toggleDesglose: () => void;
  handleRemoveItem: (id: string) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  state,
  actions,
  readonly,
  allowEditItems,
  allowRemoveItems,
  desgloseOpened,
  toggleDesglose,
  handleRemoveItem,
}) => {
  if (!state.items.length) return null;

  return (
    <Card withBorder>
      <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={toggleDesglose}>
        <Text fw={500}>Desglose ({state.items.length} items)</Text>
        <ActionIcon variant="light">
          {desgloseOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </ActionIcon>
      </Group>
      <Collapse in={desgloseOpened}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Concepto</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Cantidad</Table.Th>
              <Table.Th>Total</Table.Th>
              {!readonly && (allowEditItems || allowRemoveItems) && <Table.Th>Acciones</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {state.result.desglose.map((item: CalculationItem) => (
              <TableRow
                key={item.id}
                item={item}
                actions={actions}
                readonly={readonly}
                allowEditItems={allowEditItems}
                allowRemoveItems={allowRemoveItems}
                handleRemoveItem={handleRemoveItem}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Collapse>
    </Card>
  );
};
