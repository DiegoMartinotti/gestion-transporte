import React from 'react';
import { Stack } from '@mantine/core';
import { IVariableDefinition, IValidacionFormula } from '../../types/tarifa';
import { useFormulaEditor } from './hooks/useFormulaEditor';
import FormulaEditorHeader from './components/FormulaEditorHeader';
import FormulaEditorContent from './components/FormulaEditorContent';
import FormulaHelpModal from './components/FormulaHelpModal';

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: IVariableDefinition[];
  readonly?: boolean;
  height?: number | string;
  placeholder?: string;
  onValidate?: (validacion: IValidacionFormula) => void;
  showValidation?: boolean;
  showVariablePicker?: boolean;
  showFunctionHelper?: boolean;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  value,
  onChange,
  variables,
  readonly = false,
  height = 120,
  placeholder = 'Ingrese la fórmula de cálculo...',
  onValidate,
  showValidation = true,
  showVariablePicker = true,
  showFunctionHelper = true,
}) => {
  const {
    validacion,
    variablesOpen,
    funcionesOpen,
    helpModalOpen,
    toggleVariables,
    toggleFunciones,
    openHelp,
    closeHelp,
    insertarVariable,
    insertarFuncion,
  } = useFormulaEditor({ value, onChange, variables, showValidation, onValidate });

  return (
    <Stack gap="sm">
      <FormulaEditorHeader
        showValidation={showValidation}
        validacion={validacion}
        showFunctionHelper={showFunctionHelper}
        onOpenHelp={openHelp}
      />

      <FormulaEditorContent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readonly={readonly}
        height={height}
        showValidation={showValidation}
        validacion={validacion}
        showVariablePicker={showVariablePicker}
        showFunctionHelper={showFunctionHelper}
        variables={variables}
        variablesOpen={variablesOpen}
        funcionesOpen={funcionesOpen}
        onToggleVariables={toggleVariables}
        onToggleFunciones={toggleFunciones}
        onInsertVariable={insertarVariable}
        onInsertFunction={insertarFuncion}
      />

      <FormulaHelpModal opened={helpModalOpen} onClose={closeHelp} />
    </Stack>
  );
};

export default FormulaEditor;