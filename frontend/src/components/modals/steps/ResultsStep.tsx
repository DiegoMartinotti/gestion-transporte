import { Stack } from '@mantine/core';
import {
  ResultStatusIcon,
  ResultStatusMessage,
  ImportSummary,
  ConditionalMissingDataActions,
  ResultsActions,
} from './ResultsStepComponents';
import type { ImportResult } from '../types/ExcelImportModalTypes';

interface ResultsStepProps {
  importResult: ImportResult | null;
  loading: boolean;
  onClose: () => void;
  onResetForm: () => void;
  onDownloadMissingData: () => Promise<void>;
  onRetryImport: () => Promise<void>;
  onOpenCorrectionModal: () => void;
}

export function ResultsStep({
  importResult,
  loading,
  onClose,
  onResetForm,
  onDownloadMissingData,
  onRetryImport,
  onOpenCorrectionModal,
}: ResultsStepProps) {
  const hasMissingData = importResult?.hasMissingData;
  const hasErrorRows = Boolean(
    importResult?.summary?.errorRows && importResult.summary.errorRows > 0
  );

  return (
    <Stack gap="md" align="center">
      <ResultStatusIcon hasMissingData={hasMissingData} />

      <ResultStatusMessage hasMissingData={hasMissingData} />

      {importResult && (
        <>
          <ImportSummary importResult={importResult} />
          <ConditionalMissingDataActions
            hasMissingData={hasMissingData}
            hasErrorRows={hasErrorRows}
            loading={loading}
            onDownloadMissingData={onDownloadMissingData}
            onRetryImport={onRetryImport}
            onOpenCorrectionModal={onOpenCorrectionModal}
          />
        </>
      )}

      <ResultsActions hasMissingData={hasMissingData} onClose={onClose} onResetForm={onResetForm} />
    </Stack>
  );
}
