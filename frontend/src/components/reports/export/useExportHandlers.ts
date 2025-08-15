import { useCallback } from 'react';
import type { ReportData, ReportDefinition } from '../../../types/reports';
import type { ExportState } from './types';
import { reportService } from '../../../services/reportService';
import { createPdfExporter, createExcelExporter, createCsvExporter } from './exportHandlers';
import { validateExportConfig } from './exportValidation';
import {
  showSuccessNotification,
  showErrorNotification,
  showValidationError,
} from './exportNotifications';
import { createProgressSimulator } from './progressSimulator';

interface ExportHandlerProps {
  exportState: ExportState;
  updateExportState: (updates: Partial<ExportState>) => void;
  reportData: ReportData;
  onExportComplete?: (blob: Blob, filename: string) => void;
  onExportStart?: () => void;
  onExportError?: (error: string) => void;
}

interface UseExportHandlersReturn {
  handleExport: () => Promise<void>;
  validateConfig: () => string | null;
}

export const useExportHandlers = ({
  exportState,
  updateExportState,
  reportData,
  onExportComplete,
  onExportStart,
  onExportError,
}: ExportHandlerProps): UseExportHandlersReturn => {
  const validateConfig = useCallback((): string | null => {
    return validateExportConfig(exportState);
  }, [exportState]);

  const simulateProgress = useCallback(
    (duration = 3000) => {
      return createProgressSimulator(updateExportState)(duration);
    },
    [updateExportState]
  );

  const getReportDefinition = useCallback((): ReportDefinition => {
    return {
      id: 'export',
      name: exportState.title,
      description: '',
      type: 'custom',
      charts: [],
    };
  }, [exportState.title]);

  const exportFile = useCallback(async (): Promise<Blob> => {
    const reportDefinition = getReportDefinition();

    switch (exportState.format) {
      case 'pdf': {
        const pdfExporter = createPdfExporter();
        return pdfExporter(exportState, reportData, reportDefinition);
      }
      case 'excel': {
        const excelExporter = createExcelExporter();
        return excelExporter(exportState, reportData, reportDefinition);
      }
      case 'csv': {
        const csvExporter = createCsvExporter();
        return csvExporter(reportData);
      }
      case 'image':
        throw new Error('Exportación a imagen aún no implementada');
      default:
        throw new Error(`Formato no soportado: ${exportState.format}`);
    }
  }, [exportState, reportData, getReportDefinition]);

  const handleExport = useCallback(async () => {
    const validationError = validateConfig();
    if (validationError) {
      showValidationError(validationError);
      return;
    }

    try {
      updateExportState({ isExporting: true, progress: 0 });
      onExportStart?.();

      const progressTimer = simulateProgress(2000);
      const blob = await exportFile();

      clearInterval(progressTimer);
      updateExportState({ progress: 100 });

      reportService.downloadBlob(blob, exportState.fileName);
      onExportComplete?.(blob, exportState.fileName);
      showSuccessNotification(exportState.fileName);
    } catch (error) {
      console.error('Error during export:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onExportError?.(errorMessage);
      showErrorNotification(errorMessage);
    } finally {
      updateExportState({ isExporting: false, progress: 0 });
    }
  }, [
    validateConfig,
    updateExportState,
    simulateProgress,
    exportFile,
    exportState.fileName,
    onExportStart,
    onExportComplete,
    onExportError,
  ]);

  return {
    handleExport,
    validateConfig,
  };
};
