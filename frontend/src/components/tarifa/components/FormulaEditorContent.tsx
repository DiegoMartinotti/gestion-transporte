import React from 'react';
import { Box, Group, Textarea, Stack } from '@mantine/core';
import { IVariableDefinition, IValidacionFormula } from '../../../types/tarifa';
import FormulaValidationDisplay from './FormulaValidationDisplay';
import VariablesPanel from './VariablesPanel';
import FunctionsPanel from './FunctionsPanel';

interface FormulaEditorContentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  readonly: boolean;
  height: number | string;
  showValidation: boolean;
  validacion: IValidacionFormula | null;
  showVariablePicker: boolean;
  showFunctionHelper: boolean;
  variables: IVariableDefinition[];
  variablesOpen: boolean;
  funcionesOpen: boolean;
  onToggleVariables: () => void;
  onToggleFunciones: () => void;
  onInsertVariable: (nombre: string) => void;
  onInsertFunction: (funcion: { nombre: string; sintaxis: string }) => void;
}

const FormulaEditorContent: React.FC<FormulaEditorContentProps> = ({
  value,
  onChange,
  placeholder,
  readonly,
  height,
  showValidation,
  validacion,
  showVariablePicker,
  showFunctionHelper,
  variables,
  variablesOpen,
  funcionesOpen,
  onToggleVariables,
  onToggleFunciones,
  onInsertVariable,
  onInsertFunction,
}) => {
  return (
    <Group align="flex-start" gap="md">
      {/* Editor principal */}
      <Box style={{ flex: 1 }}>
        <Textarea
          data-formula-editor
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          readOnly={readonly}
          rows={typeof height === 'number' ? Math.floor(height / 24) : 5}
          styles={{
            input: {
              fontFamily: 'monospace',
              fontSize: '14px',
            },
          }}
        />

        {/* Validación */}
        {showValidation && (
          <FormulaValidationDisplay validacion={validacion} />
        )}
      </Box>

      {/* Panel lateral de variables y funciones */}
      {(showVariablePicker || showFunctionHelper) && !readonly && (
        <Box style={{ minWidth: 280 }}>
          <Stack gap="sm">
            {/* Variables */}
            {showVariablePicker && (
              <VariablesPanel
                variables={variables}
                variablesOpen={variablesOpen}
                onToggleVariables={onToggleVariables}
                onInsertVariable={onInsertVariable}
              />
            )}

            {/* Funciones */}
            {showFunctionHelper && (
              <FunctionsPanel
                funcionesOpen={funcionesOpen}
                onToggleFunciones={onToggleFunciones}
                onInsertFunction={onInsertFunction}
              />
            )}
          </Stack>
        </Box>
      )}
    </Group>
  );
};

export default FormulaEditorContent;