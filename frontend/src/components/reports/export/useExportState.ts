import { useState, useCallback } from 'react';
import type { ReportDefinition } from '../../../types/reports';
import type { ExportState } from './types';
import { DEFAULT_EXPORT_STATE } from './constants';
import { reportService } from '../../../services/reportService';

interface UseExportStateReturn {
  exportState: ExportState;
  updateExportState: (updates: Partial<ExportState>) => void;
  updateFileName: () => void;
}

export const useExportState = (reportDefinition: ReportDefinition): UseExportStateReturn => {
  const [exportState, setExportState] = useState<ExportState>({
    ...DEFAULT_EXPORT_STATE,
    fileName: reportService.generateFileName(reportDefinition.name, 'pdf'),
    title: reportDefinition.name,
  });

  const updateExportState = useCallback((updates: Partial<ExportState>) => {
    setExportState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateFileName = useCallback(() => {
    const newFileName = reportService.generateFileName(reportDefinition.name, exportState.format);
    updateExportState({ fileName: newFileName });
  }, [reportDefinition.name, exportState.format, updateExportState]);

  return {
    exportState,
    updateExportState,
    updateFileName,
  };
};
