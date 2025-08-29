import React from 'react';
import { Stack, Group, Button, TextInput, Select, NumberInput, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { TIPOS_MODIFICADOR, APLICAR_MODIFICADOR_A } from '../../../types/tarifa';
import { ModificadorFormState } from '../types/ReglaTarifaBuilderTypes';
import FormulaEditor from '../FormulaEditor';

interface ModificadorFormFieldsProps {
  newModificador: ModificadorFormState;
  setNewModificador: React.Dispatch<React.SetStateAction<ModificadorFormState>>;
  onAddModificador: () => void;
}

const ModificadorFormFields: React.FC<ModificadorFormFieldsProps> = ({
  newModificador,
  setNewModificador,
  onAddModificador,
}) => {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>
        Añadir nuevo modificador
      </Text>

      <Group grow>
        <Select
          label="Tipo"
          data={TIPOS_MODIFICADOR}
          value={newModificador.tipo}
          onChange={(value) =>
            setNewModificador((prev) => ({
              ...prev,
              tipo: value || 'porcentaje',
            }))
          }
        />

        <Select
          label="Aplicar a"
          data={APLICAR_MODIFICADOR_A}
          value={newModificador.aplicarA}
          onChange={(value) =>
            setNewModificador((prev) => ({
              ...prev,
              aplicarA: value || 'total',
            }))
          }
        />
      </Group>

      <Group grow>
        <NumberInput
          label="Valor"
          placeholder="10 para 10%, -5 para reducción"
          value={newModificador.valor}
          onChange={(value) =>
            setNewModificador((prev) => ({
              ...prev,
              valor: value || 0,
            }))
          }
        />

        <TextInput
          label="Descripción"
          placeholder="Descuento por volumen, recargo nocturno..."
          value={newModificador.descripcion}
          onChange={(e) =>
            setNewModificador((prev) => ({
              ...prev,
              descripcion: e.currentTarget.value,
            }))
          }
        />
      </Group>

      {/* Fórmula personalizada para tipo 'formula' */}
      {newModificador.tipo === 'formula' && (
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Fórmula personalizada
          </Text>
          <FormulaEditor
            value={newModificador.formulaPersonalizada || ''}
            onChange={(value) =>
              setNewModificador((prev) => ({
                ...prev,
                formulaPersonalizada: value,
              }))
            }
            variables={[]}
            placeholder="Ejemplo: (palets * 0.1) + (distancia * 0.5)"
            height={100}
          />
        </Stack>
      )}

      <Group justify="flex-end">
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={onAddModificador}
          disabled={!newModificador.tipo || !newModificador.descripcion}
        >
          Añadir Modificador
        </Button>
      </Group>
    </Stack>
  );
};

export default ModificadorFormFields;
