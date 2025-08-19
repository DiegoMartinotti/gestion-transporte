import React from 'react';
import {
  Stack,
  Alert,
  Text,
  Group,
  Title,
  Badge,
  ScrollArea,
  Divider,
  Button,
  Progress,
  Checkbox,
} from '@mantine/core';
import {
  IconFileUpload,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconDownload,
  IconUpload,
} from '@tabler/icons-react';
import { ExcelUploadZone } from '../excel/ExcelUploadZone';
import ExcelDataPreview from '../excel/ExcelDataPreview';
import { ExcelValidationReport } from '../excel/ExcelValidationReport';
import { ImportProgress } from '../import/ImportProgress';

interface StepProps {
  loading?: boolean;
  onAction?: () => void;
}

interface UploadStepProps extends StepProps {
  entityType: string;
  onFileAccepted: (file: File) => void;
  onTemplateDownload: () => Promise<void>;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  entityType,
  loading,
  onFileAccepted,
  onTemplateDownload,
}) => (
  <Stack gap="md">
    <Alert icon={<IconFileUpload size="1rem" />} color="blue">
      <Stack gap="xs">
        <Text size="sm">Seleccione un archivo Excel (.xlsx) con los datos a importar.</Text>
        <Text size="xs" c="dimmed">
          Los archivos deben seguir el formato de la plantilla oficial.
        </Text>
      </Stack>
    </Alert>

    <ExcelUploadZone
      onFileAccepted={onFileAccepted}
      isProcessing={loading || false}
      maxFileSize={10 * 1024 * 1024}
      entityType={entityType}
      onTemplateDownload={onTemplateDownload}
      showTemplate={true}
    />
  </Stack>
);

interface ValidationData {
  validationResult?: {
    isValid: boolean;
    errors?: Array<{
      row: number;
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    warnings?: Array<{
      row: number;
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    summary?: {
      validRows?: number;
      errorRows?: number;
      warningRows?: number;
    };
  };
  processedData?: {
    data?: Array<Record<string, string | number | boolean>>;
  };
}

interface PreviewData {
  samples?: Array<{
    sample?: Array<Record<string, string | number | boolean>>;
  }>;
}

interface ValidationStepProps extends StepProps {
  validationResult: ValidationData;
  previewData: PreviewData;
  entityType: string;
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  onAutoCorrectChange: (value: boolean) => void;
  onSkipInvalidRowsChange: (value: boolean) => void;
  onReview: () => void;
}

const ValidationHeader: React.FC<{ isValid: boolean }> = ({ isValid }) => (
  <Group justify="space-between">
    <Title order={4}>Revisión de Datos</Title>
    <Badge color={isValid ? 'green' : 'red'}>{isValid ? 'Válido' : 'Con errores'}</Badge>
  </Group>
);

const ValidationPreview: React.FC<{ previewData: PreviewData; entityType: string }> = ({
  previewData,
  entityType,
}) => {
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
};

const ValidationReport: React.FC<{ validationResult: ValidationData; entityType: string }> = ({
  validationResult,
  entityType,
}) => {
  if (!validationResult) return null;
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Resultado de validación:
      </Text>
      <ExcelValidationReport
        validationErrors={(validationResult.validationResult?.errors || []).map((error) => ({
          ...error,
          column: error.field,
          value: '',
        }))}
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
};

const ValidationOptions: React.FC<{
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  onAutoCorrectChange: (value: boolean) => void;
  onSkipInvalidRowsChange: (value: boolean) => void;
}> = ({ autoCorrect, skipInvalidRows, onAutoCorrectChange, onSkipInvalidRowsChange }) => (
  <Stack gap="xs">
    <Checkbox
      label="Corregir automáticamente errores menores"
      checked={autoCorrect}
      onChange={(e) => onAutoCorrectChange(e.currentTarget.checked)}
    />
    <Checkbox
      label="Saltar filas inválidas"
      checked={skipInvalidRows}
      onChange={(e) => onSkipInvalidRowsChange(e.currentTarget.checked)}
    />
  </Stack>
);

const ValidationStepContent: React.FC<{
  validationResult: ValidationData;
  previewData: PreviewData;
  entityType: string;
  isValid: boolean;
}> = ({ validationResult, previewData, entityType, isValid }) => (
  <>
    <ValidationHeader isValid={isValid} />
    <ValidationPreview previewData={previewData} entityType={entityType} />
    <Divider />
    <ValidationReport validationResult={validationResult} entityType={entityType} />
  </>
);

const ValidationActions: React.FC<{
  autoCorrect: boolean;
  skipInvalidRows: boolean;
  isValid: boolean;
  onAutoCorrectChange: (value: boolean) => void;
  onSkipInvalidRowsChange: (value: boolean) => void;
  onReview: () => void;
}> = ({
  autoCorrect,
  skipInvalidRows,
  isValid,
  onAutoCorrectChange,
  onSkipInvalidRowsChange,
  onReview,
}) => (
  <>
    <ValidationOptions
      autoCorrect={autoCorrect}
      skipInvalidRows={skipInvalidRows}
      onAutoCorrectChange={onAutoCorrectChange}
      onSkipInvalidRowsChange={onSkipInvalidRowsChange}
    />
    <Button onClick={onReview} disabled={!isValid && !skipInvalidRows} fullWidth>
      Continuar con la importación
    </Button>
  </>
);

export const ValidationStep: React.FC<ValidationStepProps> = ({
  validationResult,
  previewData,
  entityType,
  autoCorrect,
  skipInvalidRows,
  onAutoCorrectChange,
  onSkipInvalidRowsChange,
  onReview,
}) => {
  const isValid = validationResult?.validationResult?.isValid || false;

  return (
    <Stack gap="md">
      <ValidationStepContent
        validationResult={validationResult}
        previewData={previewData}
        entityType={entityType}
        isValid={isValid}
      />
      <ValidationActions
        autoCorrect={autoCorrect}
        skipInvalidRows={skipInvalidRows}
        isValid={isValid}
        onAutoCorrectChange={onAutoCorrectChange}
        onSkipInvalidRowsChange={onSkipInvalidRowsChange}
        onReview={onReview}
      />
    </Stack>
  );
};

interface ImportStepProps extends StepProps {
  importProgress: number;
}

const ImportStepContent: React.FC<{ importProgress: number }> = ({ importProgress }) => {
  const stats = {
    processed: Math.floor(importProgress),
    total: 100,
    successful: Math.floor(importProgress * 0.95),
    failed: Math.floor(importProgress * 0.05),
  };

  return (
    <>
      <Alert icon={<IconAlertCircle size="1rem" />} color="blue">
        Importando datos, por favor espere...
      </Alert>

      <Progress value={importProgress} animated />

      <Text size="sm" c="dimmed" ta="center">
        {importProgress}% completado
      </Text>

      <ImportProgress
        total={stats.total}
        processed={stats.processed}
        errors={stats.failed}
        warnings={0}
        isProcessing={importProgress < 100}
      />
    </>
  );
};

export const ImportStep: React.FC<ImportStepProps> = ({ importProgress }) => (
  <Stack gap="md">
    <ImportStepContent importProgress={importProgress} />
  </Stack>
);

interface ImportResultData {
  hasMissingData?: boolean;
  summary?: {
    totalRows?: number;
    insertedRows?: number;
    errorRows?: number;
  };
}

interface ResultStepProps extends StepProps {
  importResult: ImportResultData;
  onDownloadMissingData?: () => void;
  onOpenCorrectionModal?: () => void;
  onRetryImport?: () => void;
  onClose?: () => void;
}

const ResultAlert: React.FC<{ hasMissingData: boolean }> = ({ hasMissingData }) => (
  <Alert
    icon={hasMissingData ? <IconAlertCircle size="1rem" /> : <IconCheck size="1rem" />}
    color={hasMissingData ? 'orange' : 'green'}
    title={hasMissingData ? '¡Importación Parcial!' : '¡Importación Exitosa!'}
  >
    {hasMissingData ? (
      <Text size="sm">
        Algunos registros se importaron correctamente, pero otros requieren datos adicionales.
      </Text>
    ) : (
      <Text size="sm">Todos los registros se importaron correctamente.</Text>
    )}
  </Alert>
);

const ResultSummary: React.FC<{ summary?: ImportResultData['summary'] }> = ({ summary }) => {
  if (!summary) return null;
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm">Registros procesados:</Text>
        <Badge>{summary.totalRows || 0}</Badge>
      </Group>
      <Group justify="space-between">
        <Text size="sm" c="green">
          Importados exitosamente:
        </Text>
        <Badge color="green">{summary.insertedRows || 0}</Badge>
      </Group>
      {(summary.errorRows || 0) > 0 && (
        <Group justify="space-between">
          <Text size="sm" c="red">
            Con errores:
          </Text>
          <Badge color="red">{summary.errorRows}</Badge>
        </Group>
      )}
    </Stack>
  );
};

const CorrectionActions: React.FC<{
  onDownloadMissingData?: () => void;
  onOpenCorrectionModal?: () => void;
  onRetryImport?: () => void;
}> = ({ onDownloadMissingData, onOpenCorrectionModal, onRetryImport }) => (
  <Stack gap="sm">
    <Divider label="Opciones de corrección" />

    {onDownloadMissingData && (
      <Button
        onClick={onDownloadMissingData}
        leftSection={<IconDownload size="1rem" />}
        variant="light"
        fullWidth
      >
        Descargar plantilla de datos faltantes
      </Button>
    )}

    {onOpenCorrectionModal && (
      <Button
        onClick={onOpenCorrectionModal}
        leftSection={<IconUpload size="1rem" />}
        variant="light"
        fullWidth
      >
        Cargar archivo de corrección
      </Button>
    )}

    {onRetryImport && (
      <Button
        onClick={onRetryImport}
        leftSection={<IconRefresh size="1rem" />}
        variant="light"
        fullWidth
      >
        Reintentar importación
      </Button>
    )}
  </Stack>
);

export const ResultStep: React.FC<ResultStepProps> = ({
  importResult,
  onDownloadMissingData,
  onOpenCorrectionModal,
  onRetryImport,
  onClose,
}) => {
  const hasMissingData = Boolean(importResult?.hasMissingData);
  const summary = importResult?.summary;

  return (
    <Stack gap="md">
      <ResultAlert hasMissingData={hasMissingData} />
      <ResultSummary summary={summary} />
      {hasMissingData && (
        <CorrectionActions
          onDownloadMissingData={onDownloadMissingData}
          onOpenCorrectionModal={onOpenCorrectionModal}
          onRetryImport={onRetryImport}
        />
      )}
      {onClose && (
        <Button onClick={onClose} fullWidth>
          Cerrar
        </Button>
      )}
    </Stack>
  );
};
