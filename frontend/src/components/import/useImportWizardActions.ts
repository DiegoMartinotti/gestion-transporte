// Acciones separadas para useImportWizard
import { useCallback } from 'react';
import { FileWithPath } from '@mantine/dropzone';
import { ImportState, ImportResult } from './ImportWizardTypes';
import { simulateValidation, simulateImport, generateMockData } from './ImportWizardHelpers';

interface UseImportActionsProps {
  importState: ImportState;
  setImportState: React.Dispatch<React.SetStateAction<ImportState>>;
  entityType: string;
  nextStep: () => void;
  onComplete?: (result: ImportResult) => void;
}

export const useImportActions = ({
  importState,
  setImportState,
  entityType,
  nextStep,
  onComplete,
}: UseImportActionsProps) => {
  const handleFileUpload = useCallback(
    (file: FileWithPath) => {
      const data = generateMockData();

      setImportState((prev) => ({
        ...prev,
        file,
        data,
        validationErrors: [],
        correctedData: [],
      }));
      nextStep();
    },
    [setImportState, nextStep]
  );

  const handleValidation = useCallback(async () => {
    setImportState((prev) => ({ ...prev, isValidating: true }));

    try {
      const errors = await simulateValidation(importState.data);
      setImportState((prev) => ({
        ...prev,
        validationErrors: errors,
        isValidating: false,
      }));
      nextStep();
    } catch (error) {
      console.error('Error en validación:', error);
      setImportState((prev) => ({ ...prev, isValidating: false }));
    }
  }, [importState.data, setImportState, nextStep]);

  const handleImport = useCallback(async () => {
    setImportState((prev) => ({ ...prev, isImporting: true }));

    try {
      const result = await simulateImport(
        entityType,
        importState.data,
        importState.validationErrors
      );

      setImportState((prev) => ({
        ...prev,
        importResult: result,
        isImporting: false,
      }));

      nextStep();

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error en importación:', error);
      setImportState((prev) => ({ ...prev, isImporting: false }));
    }
  }, [
    entityType,
    importState.data,
    importState.validationErrors,
    setImportState,
    nextStep,
    onComplete,
  ]);

  return {
    handleFileUpload,
    handleValidation,
    handleImport,
  };
};
