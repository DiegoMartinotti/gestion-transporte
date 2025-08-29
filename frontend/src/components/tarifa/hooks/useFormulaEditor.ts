import React, { useState, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { IVariableDefinition, IValidacionFormula, FUNCIONES_FORMULA } from '../../../types/tarifa';
import { validateFormula } from '../helpers/formulaValidation';

interface UseFormulaEditorParams {
  value: string;
  onChange: (value: string) => void;
  variables: IVariableDefinition[];
  showValidation: boolean;
  onValidate?: (validacion: IValidacionFormula) => void;
}

export const useFormulaEditor = ({
  value,
  onChange,
  variables,
  showValidation,
  onValidate,
}: UseFormulaEditorParams) => {
  const [validacion, setValidacion] = useState<IValidacionFormula | null>(null);
  const [variablesOpen, { toggle: toggleVariables }] = useDisclosure(false);
  const [funcionesOpen, { toggle: toggleFunciones }] = useDisclosure(false);
  const [helpModalOpen, { open: openHelp, close: closeHelp }] = useDisclosure(false);

  // Validar fórmula usando el helper externo
  const validarFormula = useCallback(
    (formula: string) => validateFormula(formula, variables),
    [variables]
  );

  // Efecto para validar cuando cambia la fórmula
  React.useEffect(() => {
    if (showValidation && value) {
      const resultado = validarFormula(value);
      setValidacion(resultado);
      onValidate?.(resultado);
    }
  }, [value, validarFormula, showValidation, onValidate]);

  // Insertar variable en la fórmula
  const insertarVariable = useCallback(
    (nombreVariable: string) => {
      const textarea = document.querySelector(
        'textarea[data-formula-editor]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.slice(0, start) + nombreVariable + value.slice(end);
        onChange(newValue);

        // Restaurar posición del cursor
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + nombreVariable.length, start + nombreVariable.length);
        }, 0);
      } else {
        onChange(value + nombreVariable);
      }
    },
    [value, onChange]
  );

  // Insertar función en la fórmula
  const insertarFuncion = useCallback(
    (funcion: (typeof FUNCIONES_FORMULA)[0]) => {
      const plantilla = funcion.sintaxis.replace(funcion.nombre, funcion.nombre);
      insertarVariable(plantilla);
    },
    [insertarVariable]
  );

  return {
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
  };
};