import { useMemo } from 'react';
import { ImportError, CorrectionAction } from './useErrorCorrections';

export interface ErrorStats {
  totalErrors: number;
  totalWarnings: number;
  correctedErrors: number;
  skippedRows: number;
  pendingErrors: number;
  completionPercentage: number;
}

export const useErrorStats = (
  errors: ImportError[],
  corrections: CorrectionAction[]
): ErrorStats => {
  return useMemo(() => {
    const totalErrors = errors.filter((e) => e.severity === 'error').length;
    const totalWarnings = errors.filter((e) => e.severity === 'warning').length;
    const correctedErrors = corrections.filter((c) => c.type === 'edit').length;
    const skippedRows = corrections.filter((c) => c.type === 'skip').length;
    const pendingErrors = Math.max(0, totalErrors - correctedErrors - skippedRows);

    const completionPercentage =
      totalErrors > 0 ? Math.round(((correctedErrors + skippedRows) / totalErrors) * 100) : 100;

    return {
      totalErrors,
      totalWarnings,
      correctedErrors,
      skippedRows,
      pendingErrors,
      completionPercentage,
    };
  }, [errors, corrections]);
};
