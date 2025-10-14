import React from 'react';
import { ExcelImportModal } from '../../../components/modals/ExcelImportModal';
import { tramoExcelService } from '../../../services/BaseExcelService';
import { ModalReturn } from '../../../hooks/useModal';
import { TramosImportResult } from '../types';
import {
  ImportOptions,
  ImportResult,
} from '../../../components/modals/types/ExcelImportModalTypes';

interface TramoImportModalProps {
  importModal: ModalReturn;
  onImportComplete: (result: TramosImportResult) => Promise<void>;
}

export const TramoImportModal: React.FC<TramoImportModalProps> = ({
  importModal,
  onImportComplete,
}) => {
  const handleImportComplete = (result: ImportResult) => {
    const tramosResult: TramosImportResult = {
      ...result,
      entityType: 'tramos' as const,
    };
    onImportComplete(tramosResult);
  };

  return (
    <ExcelImportModal
      opened={importModal.isOpen}
      onClose={importModal.close}
      title="Importar Tramos desde Excel"
      entityType="cliente"
      onImportComplete={handleImportComplete}
      processExcelFile={async (file: File, _options: ImportOptions) => {
        const result = await tramoExcelService.importFromExcel(file);
        return result as ImportResult;
      }}
      validateExcelFile={async (_file: File) => {
        return {
          validationResult: {
            isValid: true,
            errors: [],
            warnings: [],
            validRows: [],
            invalidRows: [],
            summary: {
              totalRows: 0,
              validRows: 0,
              errorRows: 0,
              warningRows: 0,
            },
          },
          processedData: {
            data: [],
            headers: [],
          },
        };
      }}
      previewExcelFile={async (_file: File, _sampleSize?: number) => {
        return {
          samples: [],
          headers: [],
          totalRows: 0,
        };
      }}
      getTemplate={async () => {
        const blob = await tramoExcelService.getTemplate();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'plantilla_tramos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }}
    />
  );
};
