import { Stack } from '@mantine/core';
import {
  ValidationHeader,
  PreviewSection,
  ValidationReportSection,
  ImportOptions,
  ValidationActions,
} from './ValidationStepComponents';
import type { ValidationFileResult, PreviewResult } from '../types/ExcelImportModalTypes';

interface ValidationStepProps {
  entityType: 'cliente' | 'empresa' | 'personal' | 'sites' | 'viajes';
  validationResult: ValidationFileResult | null;
  previewData: PreviewResult | null;
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  onAutoCorrectChange: (value: boolean) => void;
  onSkipInvalidRowsChange: (value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ValidationStep({
  entityType,
  validationResult,
  previewData,
  autoCorrect,
  skipInvalidRows,
  onAutoCorrectChange,
  onSkipInvalidRowsChange,
  onBack,
  onContinue,
}: ValidationStepProps) {
  return (
    <Stack gap="md">
      <ValidationHeader validationResult={validationResult} />

      <PreviewSection previewData={previewData} entityType={entityType} />

      <ValidationReportSection validationResult={validationResult} entityType={entityType} />

      <ImportOptions
        autoCorrect={autoCorrect}
        skipInvalidRows={skipInvalidRows}
        onAutoCorrectChange={onAutoCorrectChange}
        onSkipInvalidRowsChange={onSkipInvalidRowsChange}
      />

      <ValidationActions onBack={onBack} onContinue={onContinue} />
    </Stack>
  );
}
