import React from 'react';
import {
  Stack,
  Group,
  Text,
  Button,
  Card,
  NumberInput,
  Select,
  TextInput,
  Collapse,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { type CalculationItem } from '../../../hooks/useCalculatorBase';

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
