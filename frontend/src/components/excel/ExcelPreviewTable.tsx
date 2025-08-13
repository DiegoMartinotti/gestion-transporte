import React from 'react';
import {
  Table,
  Paper,
  ScrollArea,
  Box,
  Text,
  Checkbox,
  Group,
  ActionIcon,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { PreviewData, ColumnConfig } from './ExcelDataPreview';
import {
  formatCellValue,
  getRowStatus,
  getRowStatusColor,
  getRowStatusIcon,
} from '../../utils/excelPreviewHelpers';

interface ExcelPreviewTableProps {
  paginatedData: PreviewData[];
  currentPage: number;
  pageSize: number;
  visibleColumns: ColumnConfig[];
  selectedRows: number[];
  isReadOnly: boolean;
  showRowNumbers: boolean;
  showValidationStatus: boolean;
  allowSorting: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  handleSort: (columnKey: string) => void;
  handleRowSelection: (rowIndex: number) => void;
  handleSelectAll: () => void;
  filteredAndSortedData: PreviewData[];
}

// Componentes auxiliares para reducir la complejidad
interface SelectAllCheckboxProps {
  isReadOnly: boolean;
  selectedRows: number[];
  paginatedData: PreviewData[];
  handleSelectAll: () => void;
}

const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({
  isReadOnly,
  selectedRows,
  paginatedData,
  handleSelectAll,
}) => {
  if (isReadOnly) return null;
  return (
    <Table.Th style={{ width: 40 }}>
      <Checkbox
        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
        indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
        onChange={handleSelectAll}
      />
    </Table.Th>
  );
};

interface TableHeaderProps {
  column: ColumnConfig;
  allowSorting: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  handleSort: (columnKey: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  column,
  allowSorting,
  sortConfig,
  handleSort,
}) => (
  <Table.Th
    key={column.key}
    style={{
      width: column.width,
      cursor: allowSorting && column.sortable !== false ? 'pointer' : 'default',
    }}
    onClick={() => column.sortable !== false && handleSort(column.key)}
  >
    <Group gap="xs" justify="space-between">
      <Text fw={500} size="sm">
        {column.label}
        {column.required && (
          <Text component="span" c="red">
            *
          </Text>
        )}
      </Text>
      {allowSorting && column.sortable !== false && sortConfig?.key === column.key && (
        <ActionIcon size="xs" variant="transparent">
          {sortConfig.direction === 'asc' ? (
            <IconSortAscending size={12} />
          ) : (
            <IconSortDescending size={12} />
          )}
        </ActionIcon>
      )}
    </Group>
  </Table.Th>
);

interface TableRowProps {
  row: PreviewData;
  index: number;
  currentPage: number;
  pageSize: number;
  selectedRows: number[];
  isReadOnly: boolean;
  showRowNumbers: boolean;
  showValidationStatus: boolean;
  visibleColumns: ColumnConfig[];
  handleRowSelection: (rowIndex: number) => void;
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  currentPage,
  pageSize,
  selectedRows,
  isReadOnly,
  showRowNumbers,
  showValidationStatus,
  visibleColumns,
  handleRowSelection,
}) => {
  const actualRowIndex = (currentPage - 1) * pageSize + index;

  return (
    <Table.Tr
      key={actualRowIndex}
      bg={selectedRows.includes(actualRowIndex) ? 'var(--mantine-color-blue-0)' : undefined}
    >
      {!isReadOnly && (
        <Table.Td>
          <Checkbox
            checked={selectedRows.includes(actualRowIndex)}
            onChange={() => handleRowSelection(actualRowIndex)}
          />
        </Table.Td>
      )}
      {showRowNumbers && (
        <Table.Td>
          <Text size="sm" c="dimmed">
            {row._rowIndex || actualRowIndex + 1}
          </Text>
        </Table.Td>
      )}
      {showValidationStatus && (
        <Table.Td>
          <Tooltip
            label={
              row._errors?.length
                ? row._errors.join(', ')
                : row._warnings?.length
                  ? row._warnings.join(', ')
                  : 'Sin problemas'
            }
          >
            <ThemeIcon size="sm" variant="light" color={getRowStatusColor(getRowStatus(row))}>
              {React.createElement(getRowStatusIcon(getRowStatus(row)), { size: 12 })}
            </ThemeIcon>
          </Tooltip>
        </Table.Td>
      )}
      {visibleColumns.map((column) => (
        <Table.Td key={column.key}>{formatCellValue(row[column.key], column)}</Table.Td>
      ))}
    </Table.Tr>
  );
};

export const ExcelPreviewTable: React.FC<ExcelPreviewTableProps> = ({
  paginatedData,
  currentPage,
  pageSize,
  visibleColumns,
  selectedRows,
  isReadOnly,
  showRowNumbers,
  showValidationStatus,
  allowSorting,
  sortConfig,
  handleSort,
  handleRowSelection,
  handleSelectAll,
  filteredAndSortedData,
}) => {
  const EmptyMessage = () => (
    <Box p="xl" ta="center">
      <Text c="dimmed">
        {filteredAndSortedData.length === 0
          ? 'No se encontraron datos que coincidan con los filtros'
          : 'No hay datos para mostrar'}
      </Text>
    </Box>
  );

  return (
    <Paper withBorder>
      <ScrollArea>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SelectAllCheckbox
                isReadOnly={isReadOnly}
                selectedRows={selectedRows}
                paginatedData={paginatedData}
                handleSelectAll={handleSelectAll}
              />
              {showRowNumbers && <Table.Th style={{ width: 60 }}>#</Table.Th>}
              {showValidationStatus && <Table.Th style={{ width: 60 }}>Estado</Table.Th>}
              {visibleColumns.map((column) => (
                <TableHeader
                  key={column.key}
                  column={column}
                  allowSorting={allowSorting}
                  sortConfig={sortConfig}
                  handleSort={handleSort}
                />
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={index}
                row={row}
                index={index}
                currentPage={currentPage}
                pageSize={pageSize}
                selectedRows={selectedRows}
                isReadOnly={isReadOnly}
                showRowNumbers={showRowNumbers}
                showValidationStatus={showValidationStatus}
                visibleColumns={visibleColumns}
                handleRowSelection={handleRowSelection}
              />
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {paginatedData.length === 0 && <EmptyMessage />}
    </Paper>
  );
};

export default ExcelPreviewTable;
