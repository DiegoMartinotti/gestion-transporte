import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  ValidationFileResult,
  PreviewResult,
} from '../components/modals/types/ExcelImportModalTypes';

interface UseExcelFileOperationsConfig {
  validateExcelFile: (file: File) => Promise<ValidationFileResult>;
  previewExcelFile: (file: File, sampleSize?: number) => Promise<PreviewResult>;
  getTemplate: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFile: (file: File | null) => void;
  setPreviewData: (data: PreviewResult | null) => void;
  setValidationResult: (result: ValidationFileResult | null) => void;
  setCurrentStep: (step: number) => void;
}

export function useExcelFileOperations(config: UseExcelFileOperationsConfig) {
  const {
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    setLoading,
    setError,
    setFile,
    setPreviewData,
    setValidationResult,
    setCurrentStep,
  } = config;

  const handleTemplateDownload = useCallback(async () => {
    try {
      await getTemplate();
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      throw error;
    }
  }, [getTemplate]);

  const handleFileUpload = useCallback(
    async (
      uploadedFile: File,
      _abortController: React.MutableRefObject<AbortController | null>
    ) => {
      try {
        setLoading(true);
        setError(null);
        setFile(uploadedFile);

        // Preview data
        const preview = await previewExcelFile(uploadedFile, 10);
        setPreviewData(preview);

        // Validate data
        const validation = await validateExcelFile(uploadedFile);
        setValidationResult(validation);

        setCurrentStep(1);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Error al procesar el archivo');
        notifications.show({
          title: 'Error',
          message: 'No se pudo procesar el archivo Excel',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    },
    [
      setLoading,
      setError,
      setFile,
      setPreviewData,
      setValidationResult,
      setCurrentStep,
      previewExcelFile,
      validateExcelFile,
    ]
  );

  return {
    handleTemplateDownload,
    handleFileUpload,
  };
}
