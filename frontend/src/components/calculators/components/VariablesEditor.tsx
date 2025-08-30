import React from 'react';
import { Grid, Text, NumberInput, Badge, Group } from '@mantine/core';
import { VariableValue } from '../helpers/formulaHelpers';

interface VariablesEditorProps {
  variables: VariableValue[];
  readonly?: boolean;
  onVariableChange: (variableName: string, value: number) => void;
}

export const VariablesEditor: React.FC<VariablesEditorProps> = ({
  variables,
  readonly = false,
  onVariableChange,
}) => {
  if (variables.length === 0) {
    return null;
  }

  return (
    <>
      <Group justify="space-between" align="center" mb="sm">
        <Text fw={500}>Variables</Text>
        <Badge color="blue" variant="light">
          {variables.length} variable{variables.length !== 1 ? 's' : ''}
        </Badge>
      </Group>

      <Grid mb="md">
        {variables.map((variable) => (
          <Grid.Col key={variable.name} span={6}>
            <NumberInput
              label={variable.description || variable.name}
              value={variable.value}
              onChange={(value) => onVariableChange(variable.name, Number(value) || 0)}
              placeholder="Ingrese valor"
              disabled={readonly}
              min={0}
            />
          </Grid.Col>
        ))}
      </Grid>
    </>
  );
};
