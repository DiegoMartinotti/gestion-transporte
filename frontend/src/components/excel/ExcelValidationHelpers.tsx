import React from 'react';
import { IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { ValidationError, ValidationSummary } from './ExcelValidationReport';

export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    error: 'red',
    warning: 'yellow',
    info: 'blue',
  };
  return colors[severity] || 'gray';
};

export const getSeverityIcon = (severity: string): React.ReactElement => {
  const icons: Record<string, React.ReactElement> = {
    error: <IconX size={16} />,
    warning: <IconAlertTriangle size={16} />,
    info: <IconInfoCircle size={16} />,
  };
  return icons[severity] || <IconInfoCircle size={16} />;
};

export const getSuccessRate = (summary: ValidationSummary): number => {
  if (summary.totalRows === 0) return 0;
  return Math.round((summary.validRows / summary.totalRows) * 100);
};

export const getProgressColor = (successRate: number): string => {
  if (successRate === 100) return 'green';
  if (successRate > 80) return 'yellow';
  return 'red';
};

export const filterErrorsBySeverity = (errors: ValidationError[]) => ({
  errors: errors.filter((e) => e.severity === 'error'),
  warnings: errors.filter((e) => e.severity === 'warning'),
  infos: errors.filter((e) => e.severity === 'info'),
});
