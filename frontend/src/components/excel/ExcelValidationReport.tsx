import React, { useState } from 'react';
import { Stack, Paper, Text, Alert, Group, Button, Box, Center, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconFileSpreadsheet,
  IconDownload,
} from '@tabler/icons-react';
import { ExcelValidationTable } from './ExcelValidationTable';
import { ExcelValidationSummaryComponent } from './ExcelValidationSummary';
import { filterErrorsBySeverity } from './ExcelValidationHelpers';

export interface ValidationError {
  row: number;
  column: string;
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
  duplicatedRows: number[];
  missingRequiredFields: string[];
  invalidDataTypes: string[];
}

export interface ExcelValidationReportProps {
  validationErrors: ValidationError[];
  validationSummary: ValidationSummary;
  fileName?: string;
  entityType?: string;
  onFixSuggestion?: (error: ValidationError) => void;
  onDownloadErrorReport?: () => void;
  onRetry?: () => void;
  isProcessing?: boolean;
}

// Componente para caso de validación exitosa
const SuccessValidationView: React.FC<{
  validationSummary: ValidationSummary;
  onRetry?: () => void;
  isProcessing: boolean;
}> = ({ validationSummary, onRetry, isProcessing }) => (
  <Paper p="md" withBorder>
    <Center>
      <Stack align="center" gap="md">
        <ThemeIcon size="xl" color="green" variant="light">
          <IconCheck size={24} />
        </ThemeIcon>
        <Box ta="center">
          <Text fw={500} size="lg" c="green">
            ¡Validación exitosa!
          </Text>
          <Text size="sm" c="dimmed">
            Todas las {validationSummary.totalRows} filas pasaron la validación
          </Text>
        </Box>
        <Button onClick={onRetry} loading={isProcessing}>
          Proceder con la importación
        </Button>
      </Stack>
    </Center>
  </Paper>
);

// Componente para header del archivo
const FileHeader: React.FC<{
  fileName: string;
  entityType: string;
  onDownloadErrorReport?: () => void;
  onRetry?: () => void;
  isProcessing: boolean;
  hasErrors: boolean;
}> = ({ fileName, entityType, onDownloadErrorReport, onRetry, isProcessing, hasErrors }) => (
  <Paper p="md" withBorder>
    <Group justify="space-between" align="center">
      <Group gap="sm">
        <ThemeIcon size="lg" variant="light" color="blue">
          <IconFileSpreadsheet size={20} />
        </ThemeIcon>
        <Box>
          <Text fw={500} size="sm">
            Reporte de Validación
          </Text>
          <Text size="xs" c="dimmed">
            {fileName} • {entityType}
          </Text>
        </Box>
      </Group>
      <Group gap="sm">
        {onDownloadErrorReport && (
          <Button
            leftSection={<IconDownload size={16} />}
            variant="light"
            size="sm"
            onClick={onDownloadErrorReport}
          >
            Descargar Reporte
          </Button>
        )}
        {onRetry && (
          <Button
            variant="light"
            size="sm"
            onClick={onRetry}
            loading={isProcessing}
            disabled={hasErrors}
          >
            Reintentar
          </Button>
        )}
      </Group>
    </Group>
  </Paper>
);

// Componente para alertas de acción
const ActionAlerts: React.FC<{
  hasErrors: boolean;
  hasWarnings: boolean;
}> = ({ hasErrors, hasWarnings }) => (
  <>
    {hasErrors && (
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="red"
        title="Se encontraron errores críticos"
      >
        <Text size="sm">
          Para continuar con la importación, debes corregir todos los errores marcados en rojo. Las
          advertencias no impiden la importación, pero es recomendable revisarlas.
        </Text>
      </Alert>
    )}

    {hasWarnings && !hasErrors && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color="yellow"
        title="Se encontraron advertencias"
      >
        <Text size="sm">
          Los datos pueden importarse, pero se recomienda revisar las advertencias para asegurar la
          calidad de los datos.
        </Text>
      </Alert>
    )}
  </>
);

export const ExcelValidationReport: React.FC<ExcelValidationReportProps> = ({
  validationErrors,
  validationSummary,
  fileName = 'archivo.xlsx',
  entityType = 'datos',
  onFixSuggestion,
  onDownloadErrorReport,
  onRetry,
  isProcessing = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: false,
    summary: false,
    información: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { errors, warnings, infos } = filterErrorsBySeverity(validationErrors);

  // Caso de validación exitosa
  if (validationErrors.length === 0 && validationSummary.validRows > 0) {
    return (
      <SuccessValidationView
        validationSummary={validationSummary}
        onRetry={onRetry}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <Stack gap="md">
      <FileHeader
        fileName={fileName}
        entityType={entityType}
        onDownloadErrorReport={onDownloadErrorReport}
        onRetry={onRetry}
        isProcessing={isProcessing}
        hasErrors={errors.length > 0}
      />

      <ExcelValidationSummaryComponent
        summary={validationSummary}
        isExpanded={expandedSections.summary}
        onToggle={() => toggleSection('summary')}
      />

      <ExcelValidationTable
        items={errors}
        title="Errores"
        color="red"
        isExpanded={expandedSections.errors}
        onToggle={() => toggleSection('errors')}
        onFixSuggestion={onFixSuggestion}
      />

      <ExcelValidationTable
        items={warnings}
        title="Advertencias"
        color="yellow"
        isExpanded={expandedSections.warnings}
        onToggle={() => toggleSection('warnings')}
        onFixSuggestion={onFixSuggestion}
      />

      <ExcelValidationTable
        items={infos}
        title="Información"
        color="blue"
        isExpanded={expandedSections.información}
        onToggle={() => toggleSection('información')}
        onFixSuggestion={onFixSuggestion}
      />

      <ActionAlerts hasErrors={errors.length > 0} hasWarnings={warnings.length > 0} />
    </Stack>
  );
};

export default ExcelValidationReport;
