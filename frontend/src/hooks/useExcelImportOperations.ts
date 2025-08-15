import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useExcelImportHandlers } from './useExcelImportHandlers';
import type {
  ImportOptions,
  ImportResult,
  ExcelImportState,
} from '../components/modals/types/ExcelImportModalTypes';

interface UseExcelImportOperationsConfig {
  state: ExcelImportState;
  processExcelFile: (file: File, options: ImportOptions) => Promise<ImportResult>;
  onImportComplete?: (result: ImportResult) => void;
  setLoading: (loading: boolean) => void;
  setImportProgress: (progress: number) => void;
  setImportResult: (result: ImportResult | null) => void;
  setCurrentStep: (step: number) => void;
  setError: (error: string | null) => void;
}

// Helper function to show notification for import results
const showImportNotification = (result: ImportResult) => {
  if (result.hasMissingData && result.summary?.errorRows && result.summary.errorRows > 0) {
    notifications.show({
      title: 'Importación parcial',
      message: `Se importaron ${result.summary?.insertedRows || 0} registros. ${result.summary?.errorRows || 0} registros requieren datos adicionales.`,
      color: 'orange',
    });
  } else {
    notifications.show({
      title: 'Importación completada',
      message: `Se importaron ${result.summary?.insertedRows || 0} registros correctamente`,
      color: 'green',
    });
  }
};

// Helper function to show notification for retry results
const showRetryNotification = (result: ImportResult) => {
  if (result.hasMissingData && result.summary?.errorRows && result.summary.errorRows > 0) {
    notifications.show({
      title: 'Importación parcial',
      message: `Se importaron ${result.summary?.insertedRows || 0} registros. ${result.summary?.errorRows || 0} registros aún requieren datos adicionales.`,
      color: 'orange',
    });
  } else {
    notifications.show({
      title: 'Importación completada',
      message: `Se importaron ${result.summary?.insertedRows || 0} registros correctamente`,
      color: 'green',
    });
  }
};

export function useExcelImportOperations(config: UseExcelImportOperationsConfig) {
  const {
    state,
    processExcelFile,
    onImportComplete,
    setLoading,
    setImportProgress,
    setImportResult,
    setCurrentStep,
    setError,
  } = config;

  const processImportResult = useCallback(
    (result: ImportResult) => {
      setImportResult(result);
      setCurrentStep(3);
      showImportNotification(result);

      if (onImportComplete) {
        onImportComplete(result);
      }
    },
    [setImportResult, setCurrentStep, onImportComplete]
  );

  const processRetryResult = useCallback(
    (result: ImportResult) => {
      setImportResult(result);
      setCurrentStep(3);
      showRetryNotification(result);

      if (onImportComplete) {
        onImportComplete(result);
      }
    },
    [setImportResult, setCurrentStep, onImportComplete]
  );

  const getImportOptions = useCallback(
    (): ImportOptions => ({
      autoCorrect: state.autoCorrect,
      skipInvalidRows: state.skipInvalidRows,
      progressCallback: (progress) => {
        setImportProgress(progress.percentage || 0);
      },
    }),
    [state.autoCorrect, state.skipInvalidRows, setImportProgress]
  );

  const handleValidationReview = useCallback(() => {
    if (state.validationResult?.validationResult?.isValid || state.skipInvalidRows) {
      setCurrentStep(2);
    } else {
      notifications.show({
        title: 'Validación pendiente',
        message: 'Debe corregir los errores o habilitar "Saltar filas inválidas"',
        color: 'orange',
      });
    }
  }, [state.validationResult, state.skipInvalidRows, setCurrentStep]);

  const { handleImport, handleRetryImport } = useExcelImportHandlers({
    setLoading,
    setImportProgress,
    setCurrentStep,
    getImportOptions,
    processExcelFile,
    processImportResult,
    processRetryResult,
    setError,
  });

  return {
    handleValidationReview,
    handleImport,
    handleRetryImport,
  };
}
