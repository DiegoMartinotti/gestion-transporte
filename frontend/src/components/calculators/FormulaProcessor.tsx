import React from 'react';
import { Paper, Title, Button, Group, Stack, Divider } from '@mantine/core';
import { IconMath, IconCalculator } from '@tabler/icons-react';
import { FormulaPersonalizada, VariableValue, FormulaResult } from './helpers/formulaHelpers';
import { FormulaSelector } from './components/FormulaSelector';
import { VariablesEditor } from './components/VariablesEditor';
import { FormulaEditor } from './components/FormulaEditor';
import { ResultDisplay } from './components/ResultDisplay';
import { useFormulaProcessor } from './hooks/useFormulaProcessor';

interface FormulaProcessorProps {
  formulas?: FormulaPersonalizada[];
  formulaSeleccionada?: string;
  variables?: VariableValue[];
  onFormulaSelect?: (formulaId: string) => void;
  onResult?: (result: FormulaResult) => void;
  readonly?: boolean;
  showEditor?: boolean;
}

export const FormulaProcessor: React.FC<FormulaProcessorProps> = ({
  formulas = [],
  formulaSeleccionada,
  variables = [],
  onFormulaSelect,
  onResult,
  readonly = false,
  showEditor = false,
}) => {
  const {
    selectedFormulaId,
    formulaVariables,
    customFormula,
    useCustom,
    result,
    editorOpened,
    selectedFormula,
    setCustomFormula,
    setUseCustom,
    toggleEditor,
    processFormula,
    handleFormulaChange,
    handleVariableChange,
  } = useFormulaProcessor({
    formulas,
    formulaSeleccionada,
    variables,
    onResult,
    showEditor,
  });

  const onFormulaChangeHandler = (formulaId: string | null) => {
    handleFormulaChange(formulaId);
    if (formulaId) {
      onFormulaSelect?.(formulaId);
    }
  };

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconMath size={20} />
          <Title order={4}>Procesador de Fórmulas</Title>
        </Group>
        {!readonly && (
          <Button
            leftSection={<IconCalculator size={16} />}
            size="sm"
            onClick={processFormula}
            disabled={!(selectedFormula || useCustom)}
          >
            Calcular
          </Button>
        )}
      </Group>

      <Stack gap="md">
        <FormulaSelector
          formulas={formulas}
          selectedFormulaId={selectedFormulaId}
          useCustom={useCustom}
          readonly={readonly}
          onFormulaChange={onFormulaChangeHandler}
          onCustomToggle={setUseCustom}
        />

        <FormulaEditor
          customFormula={customFormula}
          useCustom={useCustom}
          editorOpened={editorOpened}
          readonly={readonly}
          onFormulaChange={setCustomFormula}
          onToggleEditor={toggleEditor}
        />

        <Divider />

        <VariablesEditor
          variables={formulaVariables}
          readonly={readonly}
          onVariableChange={handleVariableChange}
        />

        <ResultDisplay result={result} />
      </Stack>
    </Paper>
  );
};

export default FormulaProcessor;
