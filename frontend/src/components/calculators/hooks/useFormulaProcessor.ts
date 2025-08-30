import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  FormulaPersonalizada,
  VariableValue,
  FormulaResult,
  getAvailableVariables,
  processFormulaCalculation,
  initializeFormulaVariables,
} from '../helpers/formulaHelpers';

interface UseFormulaProcessorProps {
  formulas: FormulaPersonalizada[];
  formulaSeleccionada?: string;
  variables: VariableValue[];
  onResult?: (result: FormulaResult) => void;
  showEditor: boolean;
}

// Helper para crear resultado vacío
const createEmptyResult = (formulaVariables: VariableValue[]): FormulaResult => ({
  resultado: 0,
  formula: '',
  variables: formulaVariables,
  error: 'No hay fórmula seleccionada',
  evaluacion: {
    expresion: '',
    tiempoEjecucion: 0,
  },
});

export const useFormulaProcessor = ({
  formulas,
  formulaSeleccionada,
  variables,
  onResult,
  showEditor,
}: UseFormulaProcessorProps) => {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(formulaSeleccionada || '');
  const [formulaVariables, setFormulaVariables] = useState<VariableValue[]>(variables);
  const [customFormula, setCustomFormula] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [result, setResult] = useState<FormulaResult | null>(null);
  const [editorOpened, { toggle: toggleEditor }] = useDisclosure(showEditor);

  const selectedFormula = useMemo(
    () => formulas.find((f) => f._id === selectedFormulaId),
    [formulas, selectedFormulaId]
  );

  const availableVariables = useMemo(() => getAvailableVariables(), []);

  const processFormula = useCallback(() => {
    const formulaToUse = useCustom ? customFormula : selectedFormula?.formula;

    if (!formulaToUse) {
      setResult(createEmptyResult(formulaVariables));
      return;
    }

    const calculationResult = processFormulaCalculation(formulaToUse, formulaVariables);
    setResult(calculationResult);
    onResult?.(calculationResult);
  }, [useCustom, customFormula, selectedFormula, formulaVariables, onResult]);

  const handleFormulaChange = useCallback((formulaId: string | null) => {
    if (!formulaId) return;
    setSelectedFormulaId(formulaId);
    setUseCustom(false);
  }, []);

  const handleVariableChange = useCallback((variableName: string, value: number) => {
    setFormulaVariables((prev) =>
      prev.map((variable) => (variable.name === variableName ? { ...variable, value } : variable))
    );
  }, []);

  // Inicializar variables cuando se selecciona una fórmula
  useEffect(() => {
    if (!selectedFormula) return;

    const newVariables = initializeFormulaVariables(selectedFormula, formulaVariables);
    const variablesWithDesc = newVariables.map((v) => {
      const definition = availableVariables.find((av) => av.name === v.name);
      return {
        ...v,
        description: definition?.description || v.name,
      };
    });
    setFormulaVariables(variablesWithDesc);
  }, [selectedFormula, availableVariables, formulaVariables]);

  // Auto-calcular cuando cambian las variables
  useEffect(() => {
    if ((selectedFormula || useCustom) && formulaVariables.length > 0) {
      processFormula();
    }
  }, [formulaVariables, selectedFormula, customFormula, useCustom, processFormula]);

  return {
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
  };
};
