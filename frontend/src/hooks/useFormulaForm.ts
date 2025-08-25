import { useCallback } from 'react';
import { useFormulaFormData, FormValues } from './useFormulaFormData';

export type { FormValues };

export const useFormulaForm = (formulaId?: string) => {
  const {
    clientes,
    loading,
    setLoading,
    validationResult,
    conflictos,
    loadClientes,
    loadFormula,
    validateFormula,
    checkConflictos,
  } = useFormulaFormData(formulaId);

  const handleSubmit = useCallback(
    async (values: FormValues, onSave: () => void) => {
      const {
        validateSubmission,
        prepareSubmissionData,
        createFormula,
        updateFormula,
        showSubmitError,
      } = await import('./useFormulaFormHelpers');

      if (!validateSubmission(validationResult, conflictos)) {
        return;
      }

      try {
        setLoading(true);
        const data = prepareSubmissionData(values);

        if (formulaId) {
          await updateFormula(formulaId, data);
        } else {
          await createFormula(data);
        }

        onSave();
      } catch (error: unknown) {
        showSubmitError(error);
      } finally {
        setLoading(false);
      }
    },
    [formulaId, validationResult, conflictos, setLoading]
  );

  return {
    clientes,
    loading,
    validationResult,
    conflictos,
    loadClientes,
    loadFormula,
    validateFormula,
    checkConflictos,
    handleSubmit,
  };
};
