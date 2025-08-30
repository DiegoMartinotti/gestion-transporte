import React from 'react';
import { Select, Switch, Group, Text } from '@mantine/core';
import { FormulaPersonalizada } from '../helpers/formulaHelpers';

interface FormulaSelectorProps {
  formulas: FormulaPersonalizada[];
  selectedFormulaId: string;
  useCustom: boolean;
  readonly?: boolean;
  onFormulaChange: (formulaId: string | null) => void;
  onCustomToggle: (useCustom: boolean) => void;
}

export const FormulaSelector: React.FC<FormulaSelectorProps> = ({
  formulas,
  selectedFormulaId,
  useCustom,
  readonly = false,
  onFormulaChange,
  onCustomToggle,
}) => {
  const formulaOptions = formulas.map((f) => ({
    value: f._id,
    label: `${f.nombre} - ${f.descripcion || 'Sin descripción'}`,
  }));

  return (
    <>
      <Group justify="space-between" align="center" mb="sm">
        <Text fw={500}>Fórmula de Cálculo</Text>
        {!readonly && (
          <Switch
            label="Usar fórmula personalizada"
            checked={useCustom}
            onChange={(event) => onCustomToggle(event.currentTarget.checked)}
          />
        )}
      </Group>

      {!useCustom && (
        <Select
          placeholder="Selecciona una fórmula"
          data={formulaOptions}
          value={selectedFormulaId}
          onChange={onFormulaChange}
          searchable
          disabled={readonly}
          mb="md"
        />
      )}
    </>
  );
};
