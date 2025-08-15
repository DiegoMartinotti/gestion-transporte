import { Stack, Group, Title, Badge, Text, ScrollArea, Switch, Button } from '@mantine/core';
import ExcelDataPreview from '../../excel/ExcelDataPreview';
import { ExcelValidationReport } from '../../excel/ExcelValidationReport';
import type { ValidationFileResult, PreviewResult } from '../types/ExcelImportModalTypes';

interface ValidationHeaderProps {
  validationResult: ValidationFileResult | null;
}

export function ValidationHeader({ validationResult }: ValidationHeaderProps) {
  return (
    <Group justify="space-between">
      <Title order={4}>Revisión de Datos</Title>
      <Badge color={validationResult?.validationResult?.isValid ? 'green' : 'red'}>
        {validationResult?.validationResult?.isValid ? 'Válido' : 'Con errores'}
      </Badge>
    </Group>
  );
}

interface PreviewSectionProps {
  previewData: PreviewResult | null;
  entityType: string;
}

export function PreviewSection({ previewData, entityType }: PreviewSectionProps) {
  if (!previewData) return null;

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Vista previa de datos:
      </Text>
      <ScrollArea h={200}>
        <ExcelDataPreview
          data={previewData.samples?.[0]?.sample || []}
          columns={[]}
          entityType={entityType}
        />
      </ScrollArea>
    </Stack>
  );
}

interface ValidationReportSectionProps {
  validationResult: ValidationFileResult | null;
  entityType: string;
}

export function ValidationReportSection({
  validationResult,
  entityType,
}: ValidationReportSectionProps) {
  if (!validationResult) return null;

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Resultado de validación:
      </Text>
      <ExcelValidationReport
        validationErrors={validationResult.validationResult?.errors || []}
        validationSummary={{
          totalRows: validationResult.processedData?.data?.length || 0,
          validRows: validationResult.validationResult?.summary?.validRows || 0,
          rowsWithErrors: validationResult.validationResult?.summary?.errorRows || 0,
          rowsWithWarnings: validationResult.validationResult?.summary?.warningRows || 0,
          totalErrors: validationResult.validationResult?.errors?.length || 0,
          totalWarnings: validationResult.validationResult?.warnings?.length || 0,
          duplicatedRows: [],
          missingRequiredFields: [],
          invalidDataTypes: [],
        }}
        entityType={entityType}
      />
    </Stack>
  );
}

interface ImportOptionsProps {
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  onAutoCorrectChange: (value: boolean) => void;
  onSkipInvalidRowsChange: (value: boolean) => void;
}

export function ImportOptions({
  autoCorrect,
  skipInvalidRows,
  onAutoCorrectChange,
  onSkipInvalidRowsChange,
}: ImportOptionsProps) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Opciones de importación:
      </Text>
      <Switch
        label="Auto-corregir errores menores"
        description="Corrige automáticamente formatos de CUIT, DNI, fechas, etc."
        checked={autoCorrect}
        onChange={(e) => onAutoCorrectChange(e.currentTarget.checked)}
      />
      <Switch
        label="Saltar filas con errores"
        description="Continúa la importación ignorando filas inválidas"
        checked={skipInvalidRows}
        onChange={(e) => onSkipInvalidRowsChange(e.currentTarget.checked)}
      />
    </Stack>
  );
}

interface ValidationActionsProps {
  onBack: () => void;
  onContinue: () => void;
}

export function ValidationActions({ onBack, onContinue }: ValidationActionsProps) {
  return (
    <Group justify="space-between" mt="md">
      <Button variant="subtle" onClick={onBack}>
        Atrás
      </Button>
      <Button onClick={onContinue}>Continuar Importación</Button>
    </Group>
  );
}
