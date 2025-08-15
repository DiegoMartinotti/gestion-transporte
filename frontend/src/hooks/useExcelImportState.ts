import { useState } from 'react';
import type {
  ExcelImportState,
  PreviewResult,
  ValidationFileResult,
  ImportResult,
} from '../components/modals/types/ExcelImportModalTypes';

export function useExcelImportState(): ExcelImportState & {
  setCurrentStep: (step: number) => void;
  setFile: (file: File | null) => void;
  setPreviewData: (data: PreviewResult | null) => void;
  setValidationResult: (result: ValidationFileResult | null) => void;
  setImportProgress: (progress: number) => void;
  setImportResult: (result: ImportResult | null) => void;
  setLoading: (loading: boolean) => void;
  setAutoCorrect: (autoCorrect: boolean) => void;
  setSkipInvalidRows: (skipInvalidRows: boolean) => void;
  setError: (error: string | null) => void;
  setCorrectionUploadModalOpen: (open: boolean) => void;
  resetState: () => void;
  resetImportForm: () => void;
} {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationFileResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(true);
  const [skipInvalidRows, setSkipInvalidRows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctionUploadModalOpen, setCorrectionUploadModalOpen] = useState(false);

  const resetState = () => {
    setCurrentStep(0);
    setFile(null);
    setPreviewData(null);
    setValidationResult(null);
    setImportProgress(0);
    setImportResult(null);
    setError(null);
    setLoading(false);
    setAutoCorrect(true);
    setSkipInvalidRows(false);
    setCorrectionUploadModalOpen(false);
  };

  const resetImportForm = () => {
    setCurrentStep(0);
    setFile(null);
    setPreviewData(null);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
  };

  return {
    currentStep,
    file,
    previewData,
    validationResult,
    importProgress,
    importResult,
    loading,
    autoCorrect,
    skipInvalidRows,
    error,
    correctionUploadModalOpen,
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
  };
}
