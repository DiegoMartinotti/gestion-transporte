import React from 'react';
import { Stack } from '@mantine/core';
import { ExcelCellValue } from '../../types/excel';
import { useExcelPreview } from '../../hooks/useExcelPreview';
import ExcelPreviewHeader from './ExcelPreviewHeader';
import ExcelPreviewFilters from './ExcelPreviewFilters';
import ExcelPreviewTable from './ExcelPreviewTable';
import ExcelPreviewPagination from './ExcelPreviewPagination';
import ExcelPreviewValidationSummary from './ExcelPreviewValidationSummary';

// Interfaces exportadas para los componentes hijos
export interface PreviewData {
  [key: string]: ExcelCellValue | number | boolean | string[] | undefined;
  _rowIndex?: number;
  _hasErrors?: boolean;
  _hasWarnings?: boolean;
  _errors?: string[];
  _warnings?: string[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required?: boolean;
  visible?: boolean;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface ExcelDataPreviewProps {
  data: PreviewData[];
  columns: ColumnConfig[];
  fileName?: string;
  entityType?: string;
  pageSize?: number;
  showValidationStatus?: boolean;
  showRowNumbers?: boolean;
  allowColumnToggle?: boolean;
  allowFiltering?: boolean;
  allowSorting?: boolean;
  onRowSelect?: (selectedRows: number[]) => void;
  onColumnVisibilityChange?: (columns: ColumnConfig[]) => void;
  isReadOnly?: boolean;
}

// Constantes para valores por defecto
const DEFAULT_FILENAME = 'archivo.xlsx';
const DEFAULT_ENTITY = 'datos';
const DEFAULT_PAGE_SIZE = 10;

const ExcelDataPreview: React.FC<ExcelDataPreviewProps> = ({
  data,
  columns,
  fileName = DEFAULT_FILENAME,
  entityType = DEFAULT_ENTITY,
  pageSize = DEFAULT_PAGE_SIZE,
  showValidationStatus = true,
  showRowNumbers = true,
  allowColumnToggle = true,
  allowFiltering = true,
  allowSorting = true,
  onRowSelect,
  onColumnVisibilityChange,
  isReadOnly = false,
}) => {
  // Usar el hook personalizado para toda la lógica
  const {
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    sortConfig,
    selectedRows,
    columnVisibility,
    visibleColumns,
    filteredAndSortedData,
    paginatedData,
    totalPages,
    validationCounts,
    handleSort,
    handleColumnVisibility,
    handleRowSelection,
    handleSelectAll,
  } = useExcelPreview({
    data,
    columns,
    pageSize,
    allowFiltering,
    allowSorting,
    onRowSelect,
    onColumnVisibilityChange,
  });

  return (
    <Stack gap="md">
      <ExcelPreviewHeader
        fileName={fileName}
        entityType={entityType}
        dataLength={data.length}
        showValidationStatus={showValidationStatus}
        validationCounts={validationCounts}
      />

      <ExcelPreviewFilters
        allowFiltering={allowFiltering}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedRows={selectedRows}
        allowColumnToggle={allowColumnToggle}
        columns={columns}
        columnVisibility={columnVisibility}
        handleColumnVisibility={handleColumnVisibility}
      />

      <ExcelPreviewTable
        paginatedData={paginatedData}
        currentPage={currentPage}
        pageSize={pageSize}
        visibleColumns={visibleColumns}
        selectedRows={selectedRows}
        isReadOnly={isReadOnly}
        showRowNumbers={showRowNumbers}
        showValidationStatus={showValidationStatus}
        allowSorting={allowSorting}
        sortConfig={sortConfig}
        handleSort={handleSort}
        handleRowSelection={handleRowSelection}
        handleSelectAll={handleSelectAll}
        filteredAndSortedData={filteredAndSortedData}
      />

      <ExcelPreviewPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        filteredAndSortedData={filteredAndSortedData}
        pageSize={pageSize}
      />

      <ExcelPreviewValidationSummary
        showValidationStatus={showValidationStatus}
        validationCounts={validationCounts}
      />
    </Stack>
  );
};

// Función de comparación para React.memo
const arePropsEqual = (
  prevProps: ExcelDataPreviewProps,
  nextProps: ExcelDataPreviewProps
): boolean => {
  // Lista de props simples a comparar
  const simpleProps: (keyof ExcelDataPreviewProps)[] = [
    'fileName',
    'entityType',
    'pageSize',
    'showValidationStatus',
    'showRowNumbers',
    'allowColumnToggle',
    'allowFiltering',
    'allowSorting',
    'isReadOnly',
  ];

  // Comparar props simples
  const simplePropsEqual = simpleProps.every((prop) => prevProps[prop] === nextProps[prop]);

  if (!simplePropsEqual) return false;

  // Comparar referencias
  return (
    prevProps.data === nextProps.data &&
    prevProps.columns === nextProps.columns &&
    prevProps.onRowSelect === nextProps.onRowSelect &&
    prevProps.onColumnVisibilityChange === nextProps.onColumnVisibilityChange
  );
};

export default React.memo(ExcelDataPreview, arePropsEqual);
