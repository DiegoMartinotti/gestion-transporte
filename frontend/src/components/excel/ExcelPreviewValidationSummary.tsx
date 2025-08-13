import React from 'react';
import { Alert, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ValidationCounts {
  errorCount: number;
  warningCount: number;
  successCount: number;
  totalCount: number;
}

interface ExcelPreviewValidationSummaryProps {
  showValidationStatus: boolean;
  validationCounts: ValidationCounts;
}

export const ExcelPreviewValidationSummary: React.FC<ExcelPreviewValidationSummaryProps> = ({
  showValidationStatus,
  validationCounts,
}) => {
  const { errorCount, warningCount } = validationCounts;

  if (!showValidationStatus || (errorCount === 0 && warningCount === 0)) {
    return null;
  }

  return (
    <Alert
      icon={<IconAlertTriangle size={16} />}
      color={errorCount > 0 ? 'red' : 'yellow'}
      title="Resumen de validación"
    >
      <Text size="sm">
        {errorCount > 0 && `${errorCount} filas con errores que deben corregirse. `}
        {warningCount > 0 && `${warningCount} filas con advertencias. `}
        Revisa los datos antes de proceder con la importación.
      </Text>
    </Alert>
  );
};

export default ExcelPreviewValidationSummary;
