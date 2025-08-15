import { useState, useCallback } from 'react';
import { generateCommonFixes } from './useErrorCorrections.helpers';

export interface ImportError {
  row: number;
  field: string;
  value: unknown;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface CorrectionAction {
  type: 'edit' | 'delete' | 'skip';
  row: number;
  field?: string;
  newValue?: unknown;
}

export interface CorrectedData {
  [key: string]: unknown;
}

export const useErrorCorrections = (errors: ImportError[], data: CorrectedData[]) => {
  const [corrections, setCorrections] = useState<CorrectionAction[]>([]);

  const handleEdit = useCallback((row: number, field: string, newValue: unknown) => {
    setCorrections((prev) => {
      const filtered = prev.filter((c) => !(c.row === row && c.field === field));
      return [...filtered, { type: 'edit', row, field, newValue }];
    });
  }, []);

  const handleSkipRow = useCallback((row: number) => {
    setCorrections((prev) => {
      const filtered = prev.filter((c) => c.row !== row);
      return [...filtered, { type: 'skip', row }];
    });
  }, []);

  const handleDeleteRow = useCallback((row: number) => {
    setCorrections((prev) => {
      const filtered = prev.filter((c) => c.row !== row);
      return [...filtered, { type: 'delete', row }];
    });
  }, []);

  const applySuggestion = useCallback(
    (error: ImportError) => {
      if (error.suggestion) {
        handleEdit(error.row, error.field, error.suggestion);
      }
    },
    [handleEdit]
  );

  const bulkFixCommonErrors = useCallback(() => {
    const commonFixes = generateCommonFixes(errors);
    setCorrections((prev) => [...prev, ...commonFixes]);
  }, [errors]);

  const applyCorrections = useCallback(() => {
    const correctedData = [...data];

    // Aplicar correcciones
    corrections.forEach((correction) => {
      if (correction.type === 'edit' && correction.field && correction.newValue !== undefined) {
        correctedData[correction.row - 1] = {
          ...correctedData[correction.row - 1],
          [correction.field]: correction.newValue,
        };
      }
    });

    // Filtrar filas eliminadas o saltadas
    const rowsToRemove = new Set(
      corrections.filter((c) => c.type === 'delete' || c.type === 'skip').map((c) => c.row)
    );

    const finalData = correctedData.filter((_, index) => !rowsToRemove.has(index + 1));
    const skippedRows = corrections.filter((c) => c.type === 'skip').map((c) => c.row);

    return { finalData, skippedRows };
  }, [data, corrections]);

  return {
    corrections,
    handleEdit,
    handleSkipRow,
    handleDeleteRow,
    applySuggestion,
    bulkFixCommonErrors,
    applyCorrections,
  };
};
