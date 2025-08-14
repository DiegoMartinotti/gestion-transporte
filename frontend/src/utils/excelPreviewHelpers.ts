import React from 'react';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { PreviewData, ColumnConfig } from '../components/excel/ExcelDataPreview';
import { ExcelCellValue } from '../types/excel';

// Constantes para mensajes
const MESSAGES = {
  EMPTY_VALUE: '—',
  BOOLEAN_YES: 'Sí',
  BOOLEAN_NO: 'No',
};

// Funciones de validación
export const calculateValidationCounts = (data: PreviewData[]) => {
  const errorCount = data.filter((row) => row._hasErrors).length;
  const warningCount = data.filter((row) => row._hasWarnings).length;
  const successCount = data.length - errorCount - warningCount;
  const totalCount = data.length;

  return { errorCount, warningCount, successCount, totalCount };
};

export const getRowStatus = (row: PreviewData): string => {
  if (row._hasErrors) return 'error';
  if (row._hasWarnings) return 'warning';
  return 'success';
};

export const getRowStatusColor = (status: string): string => {
  switch (status) {
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    default:
      return 'green';
  }
};

export const getRowStatusIcon = (status: string): React.ComponentType<{ size: number }> => {
  switch (status) {
    case 'error':
      return IconX;
    case 'warning':
      return IconAlertTriangle;
    default:
      return IconCheck;
  }
};

// Funciones de formateo
const formatBooleanValue = (value: ExcelCellValue | string[] | undefined): string => {
  return value ? MESSAGES.BOOLEAN_YES : MESSAGES.BOOLEAN_NO;
};

const formatDateValue = (value: ExcelCellValue | string[] | undefined): string => {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return MESSAGES.EMPTY_VALUE;
    }
  }
  return MESSAGES.EMPTY_VALUE;
};

const formatNumberValue = (value: ExcelCellValue | string[] | undefined): string => {
  return typeof value === 'number' ? value.toLocaleString() : String(value);
};

export const formatCellValue = (
  value: ExcelCellValue | string[] | undefined,
  column: ColumnConfig
): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return React.createElement(
      'span',
      { style: { color: '#868e96', fontStyle: 'italic' } },
      MESSAGES.EMPTY_VALUE
    );
  }

  switch (column.type) {
    case 'boolean':
      return formatBooleanValue(value);
    case 'date':
      return formatDateValue(value);
    case 'number':
      return formatNumberValue(value);
    default:
      return String(value);
  }
};

// Funciones de filtrado y procesamiento (no necesarias con el nuevo hook)
// pero las mantenemos por si se quieren usar de forma independiente
export const applySearchFilter = (data: PreviewData[], searchQuery: string): PreviewData[] => {
  if (!searchQuery) return data;

  return data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
};

export const applyColumnFilters = (
  data: PreviewData[],
  filters: Record<string, string>
): PreviewData[] => {
  let result = data;

  Object.entries(filters).forEach(([columnKey, filterValue]) => {
    if (filterValue) {
      result = result.filter((row) =>
        String(row[columnKey] || '')
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }
  });

  return result;
};

// Función auxiliar para manejar valores nulos
const handleNullValues = (
  aValue: ExcelCellValue | string[] | undefined,
  bValue: ExcelCellValue | string[] | undefined,
  direction: 'asc' | 'desc'
): number | null => {
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return direction === 'asc' ? -1 : 1;
  if (bValue == null) return direction === 'asc' ? 1 : -1;
  return null;
};

// Función auxiliar para comparación numérica
const compareNumeric = (aNum: number, bNum: number, direction: 'asc' | 'desc'): number => {
  return direction === 'asc' ? aNum - bNum : bNum - aNum;
};

// Función auxiliar para comparación de strings
const compareStrings = (aStr: string, bStr: string, direction: 'asc' | 'desc'): number => {
  const comparison = aStr.localeCompare(bStr);
  return direction === 'asc' ? comparison : -comparison;
};

export const compareValues = (
  aValue: ExcelCellValue | string[] | undefined,
  bValue: ExcelCellValue | string[] | undefined,
  direction: 'asc' | 'desc'
): number => {
  // Manejo de valores nulos
  const nullResult = handleNullValues(aValue, bValue, direction);
  if (nullResult !== null) return nullResult;

  // Conversión a strings
  const aStr = String(aValue);
  const bStr = String(bValue);

  // Intentar comparación numérica
  const aNum = Number(aStr);
  const bNum = Number(bStr);

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return compareNumeric(aNum, bNum, direction);
  }

  // Comparación de strings
  return compareStrings(aStr, bStr, direction);
};

export const applySorting = (
  data: PreviewData[],
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
): PreviewData[] => {
  if (!sortConfig) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    return compareValues(aValue, bValue, sortConfig.direction);
  });
};
