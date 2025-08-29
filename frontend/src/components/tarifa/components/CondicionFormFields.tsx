import React from 'react';
import { Stack, Group, Button, TextInput, Select, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { OPERADORES_CONDICION } from '../../../types/tarifa';
import { CondicionFormState } from '../types/ReglaTarifaBuilderTypes';

interface CondicionFormFieldsProps {
  newCondicion: CondicionFormState;
  setNewCondicion: React.Dispatch<React.SetStateAction<CondicionFormState>>;
  onAddCondicion: () => void;
}

const CondicionFormFields: React.FC<CondicionFormFieldsProps> = ({
  newCondicion,
  setNewCondicion,
  onAddCondicion,
}) => {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>
        Añadir nueva condición
      </Text>
      <Group grow>
        <TextInput
          label="Campo"
          placeholder="viaje.palets, cliente.codigo, tramo.distancia"
          value={newCondicion.campo}
          onChange={(e) =>
            setNewCondicion((prev) => ({
              ...prev,
              campo: e.currentTarget.value,
            }))
          }
        />

        <Select
          label="Operador"
          data={OPERADORES_CONDICION}
          value={newCondicion.operador}
          onChange={(value) =>
            setNewCondicion((prev) => ({
              ...prev,
              operador: value || 'igual',
            }))
          }
        />
      </Group>

      <Group grow>
        <TextInput
          label="Valor"
          placeholder="20, 'texto', true, etc."
          value={String(newCondicion.valor)}
          onChange={(e) =>
            setNewCondicion((prev) => ({
              ...prev,
              valor: e.currentTarget.value,
            }))
          }
        />

        {newCondicion.operador === 'entre' && (
          <TextInput
            label="Valor hasta"
            placeholder="Valor máximo del rango"
            value={String(newCondicion.valorHasta || '')}
            onChange={(e) =>
              setNewCondicion((prev) => ({
                ...prev,
                valorHasta: e.currentTarget.value,
              }))
            }
          />
        )}
      </Group>

      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={onAddCondicion}
          disabled={!newCondicion.campo || !newCondicion.operador}
        >
          Añadir Condición
        </Button>
      </Group>
    </Stack>
  );
};

export default CondicionFormFields;
