import React from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Table,
  Card,
  NumberInput,
  Select,
  TextInput,
  Collapse,
} from '@mantine/core';
import { IconPlus, IconTrash, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { type CalculationItem } from '../../hooks/useCalculatorBase';

// Re-export types and components from separate files
export * from './types/calculatorTypes';
export * from './components';

// Remaining large components

export interface AddItemFormProps {
  readonly: boolean;
  allowAddItems: boolean;
  addItemOpened: boolean;
  openAddItem: () => void;
  closeAddItem: () => void;
  newItem: Partial<CalculationItem>;
  setNewItem: React.Dispatch<React.SetStateAction<Partial<CalculationItem>>>;
  handleAddItem: () => void;
  availableTypes: Array<{ value: string; label: string }>;
}

export const AddItemForm: React.FC<AddItemFormProps> = ({
  readonly,
  allowAddItems,
  addItemOpened,
  openAddItem,
  closeAddItem,
  newItem,
  setNewItem,
  handleAddItem,
  availableTypes,
}) => {
  if (readonly || !allowAddItems) return null;

  const updateNewItem = (field: string, value: string | number | boolean) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card withBorder mb="md">
      <Group justify="space-between" mb="md">
        <Text fw={500}>Agregar Item</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openAddItem}>
          Nuevo Item
        </Button>
      </Group>
      <Collapse in={addItemOpened}>
        <Stack gap="sm">
          <TextInput
            label="Concepto"
            value={newItem.concepto || ''}
            onChange={(e) => updateNewItem('concepto', e.target.value)}
            placeholder="Descripción del item"
          />
          <Group grow>
            <NumberInput
              label="Valor"
              value={newItem.valor}
              onChange={(value) => updateNewItem('valor', Number(value) || 0)}
              decimalScale={2}
              fixedDecimalScale
            />
            <Select
              label="Tipo"
              value={newItem.tipo}
              onChange={(value) => updateNewItem('tipo', value as string)}
              data={availableTypes}
            />
          </Group>
          {newItem.tipo === 'VARIABLE' && (
            <Group grow>
              <NumberInput
                label="Cantidad"
                value={newItem.cantidad}
                onChange={(value) => updateNewItem('cantidad', Number(value) || 1)}
                min={0}
              />
              <TextInput
                label="Unidad"
                value={newItem.unidad || ''}
                onChange={(e) => updateNewItem('unidad', e.target.value)}
                placeholder="ej: kg, pallet, hora"
              />
            </Group>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={closeAddItem} size="sm">
              Cancelar
            </Button>
            <Button
              onClick={handleAddItem}
              size="sm"
              disabled={!newItem.concepto || newItem.valor === undefined}
            >
              Agregar
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Card>
  );
};

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

export interface MetadataSectionProps {
  state: CalculatorState;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ state }) => {
  if (!state.result.metadatos) return null;

  return (
    <Card withBorder mt="md" bg="gray.0">
      <Text fw={500} mb="sm">
        Información del Cálculo
      </Text>
      <Group gap="md">
        {state.result.metadatos.itemCount && (
          <Text size="xs" c="dimmed">
            Items: {state.result.metadatos.itemCount}
          </Text>
        )}
        {state.result.metadatos.calculatedAt && (
          <Text size="xs" c="dimmed">
            Calculado: {new Date(state.result.metadatos.calculatedAt).toLocaleString()}
          </Text>
        )}
        {state.result.metadatos.precision && (
          <Text size="xs" c="dimmed">
            Precisión: {state.result.metadatos.precision} decimales
          </Text>
        )}
      </Group>
    </Card>
  );
};
