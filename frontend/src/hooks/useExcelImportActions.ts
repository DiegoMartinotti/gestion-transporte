import { useExcelFileOperations } from './useExcelFileOperations';
import { useExcelImportOperations } from './useExcelImportOperations';
import { useExcelCorrectionOperations } from './useExcelCorrectionOperations';
import type {
  ExcelImportActions,
  ExcelImportActionsConfig,
} from '../components/modals/types/ExcelImportModalTypes';

export function useExcelImportActions(config: ExcelImportActionsConfig): ExcelImportActions {
  const {
    state,
    processExcelFile,
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    onImportComplete,
  } = config;

  // Destructure state setters
  const {
    setCurrentStep,
    setFile,
    setPreviewData,
    setValidationResult,
    setImportProgress,
    setImportResult,
    setLoading,
    setAutoCorrect,
    setSkipInvalidRows,
    setError,
    setCorrectionUploadModalOpen,
    resetState,
    resetImportForm,
  } = state;

  // File operations
  const fileOperations = useExcelFileOperations({
    validateExcelFile,
    previewExcelFile,
    getTemplate,
    setLoading,
    setError,
    setFile,
    setPreviewData,
    setValidationResult,
    setCurrentStep,
  });

  // Import operations
  const importOperations = useExcelImportOperations({
    state,
    processExcelFile,
    onImportComplete,
    setLoading,
    setImportProgress,
    setImportResult,
    setCurrentStep,
    setError,
  });

  // Correction operations
  const correctionOperations = useExcelCorrectionOperations({
    state,
    setLoading,
    setCorrectionUploadModalOpen,
    setImportResult,
  });

  return {
    setCurrentStep,
    setFile,
    setPreviewData,
    setValidationResult,
    setImportProgress,
    setImportResult,
    setLoading,
    setAutoCorrect,
    setSkipInvalidRows,
    setError,
    setCorrectionUploadModalOpen,
    resetState,
    resetImportForm,
    handleFileUpload: fileOperations.handleFileUpload,
    handleValidationReview: importOperations.handleValidationReview,
    handleImport: importOperations.handleImport,
    handleRetryImport: importOperations.handleRetryImport,
    handleTemplateDownload: fileOperations.handleTemplateDownload,
    handleDownloadMissingDataTemplates: correctionOperations.handleDownloadMissingDataTemplates,
    handleCorrectionUploadSuccess: correctionOperations.handleCorrectionUploadSuccess,
  };
}
