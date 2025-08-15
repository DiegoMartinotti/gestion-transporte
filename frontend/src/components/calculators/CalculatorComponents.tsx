import React from 'react';
import {
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Table,
  Alert,
  Card,
  SimpleGrid,
  NumberInput,
  Select,
  TextInput,
  Collapse,
  Box,
} from '@mantine/core';
import {
  IconCalculator,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { type CalculationItem } from '../../hooks/useCalculatorBase';

// Type definitions
export interface CalculatorState {
  items: CalculationItem[];
  result: CalculationResult;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

export interface CalculatorActions {
  formatValue: (value: number) => string;
  recalculate: () => void;
  addItem: (item: Omit<CalculationItem, 'id'>) => void;
  removeItem: (id: string) => void;
  setItems: (items: CalculationItem[]) => void;
}

export interface CalculationResult {
  total: number;
  subtotal: number;
  recargos?: number;
  descuentos?: number;
  desglose: CalculationItem[];
  metadatos?: {
    itemCount?: number;
    calculatedAt?: string;
    precision?: number;
  };
}

// Helper Components
export interface CompactViewProps {
  title: string;
  state: CalculatorState;
  actions: CalculatorActions;
}

export const CompactView: React.FC<CompactViewProps> = ({ title, state, actions }) => (
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Group>
        <IconCalculator size={20} />
        <Text fw={500}>{title}</Text>
      </Group>
      <Badge size="lg" variant="filled" color="blue">
        {actions.formatValue(state.result.total)}
      </Badge>
    </Group>
    {state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="red">
        {state.error}
      </Alert>
    )}
    {!state.isValid && !state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
        Configuración incompleta
      </Alert>
    )}
  </Card>
);

export interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  actions: CalculatorActions;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ title, subtitle, actions }) => (
  <Group justify="space-between" mb="md">
    <Box>
      <Group>
        <IconCalculator size={24} />
        <Title order={3}>{title}</Title>
      </Group>
      {subtitle && (
        <Text size="sm" c="dimmed" mt={4}>
          {subtitle}
        </Text>
      )}
    </Box>
    <Group>
      <Button
        variant="light"
        leftSection={<IconRefresh size={16} />}
        onClick={actions.recalculate}
        size="sm"
      >
        Recalcular
      </Button>
    </Group>
  </Group>
);

export interface AlertsSectionProps {
  state: CalculatorState;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ state }) => (
  <>
    {state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="red" mb="md">
        {state.error}
      </Alert>
    )}
    {!state.isValid && !state.error && (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow" mb="md">
        Configuración incompleta o valores inválidos
      </Alert>
    )}
  </>
);

export interface TotalsSummaryProps {
  state: CalculatorState;
  actions: CalculatorActions;
}

export const TotalsSummary: React.FC<TotalsSummaryProps> = ({ state, actions }) => (
  <SimpleGrid cols={state.result.descuentos || state.result.recargos ? 4 : 2} mb="md">
    <Card withBorder p="sm">
      <Text size="xs" c="dimmed" mb={4}>
        Subtotal
      </Text>
      <Text fw={500}>{actions.formatValue(state.result.subtotal)}</Text>
    </Card>
    {state.result.recargos && (
      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" mb={4}>
          Recargos
        </Text>
        <Text fw={500} c="green">
          +{actions.formatValue(state.result.recargos)}
        </Text>
      </Card>
    )}
    {state.result.descuentos && (
      <Card withBorder p="sm">
        <Text size="xs" c="dimmed" mb={4}>
          Descuentos
        </Text>
        <Text fw={500} c="red">
          -{actions.formatValue(state.result.descuentos)}
        </Text>
      </Card>
    )}
    <Card withBorder p="sm" bg="blue.0">
      <Text size="xs" c="dimmed" mb={4}>
        Total
      </Text>
      <Text fw={700} size="lg" c="blue">
        {actions.formatValue(state.result.total)}
      </Text>
    </Card>
  </SimpleGrid>
);

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
