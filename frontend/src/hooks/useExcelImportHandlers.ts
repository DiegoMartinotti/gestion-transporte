import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ImportOptions, ImportResult } from '../components/modals/types/ExcelImportModalTypes';

const IMPORT_ERROR_MESSAGE = 'Error durante la importación';

// Helper function to handle import errors
const handleImportError = (err: Error, setError: (error: string | null) => void) => {
  setError(err.message || IMPORT_ERROR_MESSAGE);
  notifications.show({
    title: 'Error en importación',
    message: err.message || IMPORT_ERROR_MESSAGE,
    color: 'red',
  });
};

interface UseExcelImportHandlersConfig {
  setLoading: (loading: boolean) => void;
  setImportProgress: (progress: number) => void;
  setCurrentStep: (step: number) => void;
  getImportOptions: () => ImportOptions;
  processExcelFile: (file: File, options: ImportOptions) => Promise<ImportResult>;
  processImportResult: (result: ImportResult) => void;
  processRetryResult: (result: ImportResult) => void;
  setError: (error: string | null) => void;
}

export function useExcelImportHandlers(config: UseExcelImportHandlersConfig) {
  const {
    setLoading,
    setImportProgress,
    setCurrentStep,
    getImportOptions,
    processExcelFile,
    processImportResult,
    processRetryResult,
    setError,
  } = config;

  const handleImport = useCallback(
    async (file: File | null, _abortController: React.MutableRefObject<AbortController | null>) => {
      if (!file) return;

      try {
        setLoading(true);
        setImportProgress(0);
        _abortController.current = new AbortController();

        const options = getImportOptions();
        const result = await processExcelFile(file, options);
        processImportResult(result);
      } catch (err) {
        handleImportError(err as Error, setError);
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      setImportProgress,
      getImportOptions,
      processExcelFile,
      processImportResult,
      setError,
    ]
  );

  const handleRetryImport = useCallback(
    async (file: File | null, _abortController: React.MutableRefObject<AbortController | null>) => {
      if (!file) {
        notifications.show({
          title: 'Error',
          message: 'No hay archivo para reintentar la importación',
          color: 'red',
        });
        return;
      }

      try {
        setLoading(true);
        setCurrentStep(2);
        setImportProgress(0);

        const options = getImportOptions();
        const result = await processExcelFile(file, options);
        processRetryResult(result);
      } catch (err) {
        handleImportError(err as Error, setError);
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      setCurrentStep,
      setImportProgress,
      getImportOptions,
      processExcelFile,
      processRetryResult,
      setError,
    ]
  );

  return {
    handleImport,
    handleRetryImport,
  };
}
