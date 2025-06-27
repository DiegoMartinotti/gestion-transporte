import React, { useState, useMemo } from 'react';
import {
  Stack,
  Paper,
  Text,
  Table,
  ScrollArea,
  Group,
  Badge,
  Button,
  ActionIcon,
  Select,
  TextInput,
  Pagination,
  Alert,
  Box,
  Tooltip,
  ThemeIcon,
  Divider,
  Checkbox,
  Menu,
} from '@mantine/core';
import {
  IconEye,
  IconEyeOff,
  IconSearch,
  IconFilter,
  IconDownload,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconFileSpreadsheet,
  IconSettings,
  IconColumns,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

export interface PreviewData {
  [key: string]: any;
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
  onDataChange?: (data: PreviewData[]) => void;
  onRowSelect?: (selectedRows: number[]) => void;
  onColumnVisibilityChange?: (columns: ColumnConfig[]) => void;
  isReadOnly?: boolean;
}

export const ExcelDataPreview: React.FC<ExcelDataPreviewProps> = ({
  data,
  columns,
  fileName = 'archivo.xlsx',
  entityType = 'datos',
  pageSize = 10,
  showValidationStatus = true,
  showRowNumbers = true,
  allowColumnToggle = true,
  allowFiltering = true,
  allowSorting = true,
  onDataChange,
  onRowSelect,
  onColumnVisibilityChange,
  isReadOnly = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  );
  const [filters, setFilters] = useState<Record<string, string>>({});

  const visibleColumns = useMemo(
    () => columns.filter(col => columnVisibility[col.key]),
    [columns, columnVisibility]
  );

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Apply search filter
    if (debouncedSearchQuery) {
      processedData = processedData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        processedData = processedData.filter(row =>
          String(row[columnKey] || '').toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      processedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processedData;
  }, [data, debouncedSearchQuery, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (!allowSorting) return;
    
    setSortConfig(current => {
      if (current?.key === columnKey) {
        return current.direction === 'asc' 
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleColumnVisibilityToggle = (columnKey: string) => {
    const newVisibility = {
      ...columnVisibility,
      [columnKey]: !columnVisibility[columnKey],
    };
    setColumnVisibility(newVisibility);
    
    const updatedColumns = columns.map(col => ({
      ...col,
      visible: newVisibility[col.key],
    }));
    onColumnVisibilityChange?.(updatedColumns);
  };

  const handleRowSelect = (rowIndex: number) => {
    const newSelectedRows = selectedRows.includes(rowIndex)
      ? selectedRows.filter(index => index !== rowIndex)
      : [...selectedRows, rowIndex];
    
    setSelectedRows(newSelectedRows);
    onRowSelect?.(newSelectedRows);
  };

  const handleSelectAll = () => {
    const allRowIndices = paginatedData.map((_, index) => (currentPage - 1) * pageSize + index);
    const newSelectedRows = selectedRows.length === allRowIndices.length 
      ? [] 
      : allRowIndices;
    
    setSelectedRows(newSelectedRows);
    onRowSelect?.(newSelectedRows);
  };

  const getRowStatus = (row: PreviewData) => {
    if (row._hasErrors) return 'error';
    if (row._hasWarnings) return 'warning';
    return 'success';
  };

  const getRowStatusColor = (status: string) => {
    switch (status) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      default: return 'green';
    }
  };

  const getRowStatusIcon = (status: string) => {
    switch (status) {
      case 'error': return IconX;
      case 'warning': return IconAlertTriangle;
      default: return IconCheck;
    }
  };

  const formatCellValue = (value: any, column: ColumnConfig) => {
    if (value === null || value === undefined || value === '') {
      return <Text c="dimmed" fs="italic">—</Text>;
    }

    switch (column.type) {
      case 'boolean':
        return value ? 'Sí' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value);
    }
  };

  const errorCount = data.filter(row => row._hasErrors).length;
  const warningCount = data.filter(row => row._hasWarnings).length;
  const successCount = data.length - errorCount - warningCount;

  return (
    <Stack gap="md">
      {/* Header */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconFileSpreadsheet size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={500} size="sm">
                Vista Previa de Datos
              </Text>
              <Text size="xs" c="dimmed">
                {fileName} • {data.length} registros • {entityType}
              </Text>
            </Box>
          </Group>
          
          {showValidationStatus && (
            <Group gap="sm">
              <Badge color="green" variant="light" size="sm">
                {successCount} válidos
              </Badge>
              {warningCount > 0 && (
                <Badge color="yellow" variant="light" size="sm">
                  {warningCount} advertencias
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge color="red" variant="light" size="sm">
                  {errorCount} errores
                </Badge>
              )}
            </Group>
          )}
        </Group>
      </Paper>

      {/* Controls */}
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {allowFiltering && (
              <TextInput
                placeholder="Buscar en todos los campos..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: 250 }}
              />
            )}
            
            {selectedRows.length > 0 && (
              <Badge variant="light" color="blue">
                {selectedRows.length} seleccionadas
              </Badge>
            )}
          </Group>
          
          <Group gap="sm">
            {allowColumnToggle && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconColumns size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Columnas visibles</Menu.Label>
                  {columns.map(column => (
                    <Menu.Item
                      key={column.key}
                      leftSection={
                        <Checkbox
                          checked={columnVisibility[column.key]}
                          onChange={() => handleColumnVisibilityToggle(column.key)}
                        />
                      }
                      onClick={() => handleColumnVisibilityToggle(column.key)}
                    >
                      {column.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
            
            <ActionIcon variant="light">
              <IconDownload size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {!isReadOnly && (
                  <Table.Th style={{ width: 40 }}>
                    <Checkbox
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
                      onChange={handleSelectAll}
                    />
                  </Table.Th>
                )}
                
                {showRowNumbers && (
                  <Table.Th style={{ width: 60 }}>#</Table.Th>
                )}
                
                {showValidationStatus && (
                  <Table.Th style={{ width: 60 }}>Estado</Table.Th>
                )}
                
                {visibleColumns.map(column => (
                  <Table.Th
                    key={column.key}
                    style={{ 
                      width: column.width,
                      cursor: allowSorting && column.sortable !== false ? 'pointer' : 'default'
                    }}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <Group gap="xs" justify="space-between">
                      <Text fw={500} size="sm">
                        {column.label}
                        {column.required && <Text component="span" c="red">*</Text>}
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
                ))}
              </Table.Tr>
            </Table.Thead>
            
            <Table.Tbody>
              {paginatedData.map((row, index) => {
                const actualRowIndex = (currentPage - 1) * pageSize + index;
                const rowStatus = showValidationStatus ? getRowStatus(row) : 'success';
                const StatusIcon = getRowStatusIcon(rowStatus);
                
                return (
                  <Table.Tr 
                    key={actualRowIndex}
                    bg={selectedRows.includes(actualRowIndex) ? 'var(--mantine-color-blue-0)' : undefined}
                  >
                    {!isReadOnly && (
                      <Table.Td>
                        <Checkbox
                          checked={selectedRows.includes(actualRowIndex)}
                          onChange={() => handleRowSelect(actualRowIndex)}
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
                            row._errors?.length ? row._errors.join(', ') :
                            row._warnings?.length ? row._warnings.join(', ') :
                            'Sin problemas'
                          }
                        >
                          <ThemeIcon 
                            size="sm" 
                            variant="light" 
                            color={getRowStatusColor(rowStatus)}
                          >
                            <StatusIcon size={12} />
                          </ThemeIcon>
                        </Tooltip>
                      </Table.Td>
                    )}
                    
                    {visibleColumns.map(column => (
                      <Table.Td key={column.key}>
                        {formatCellValue(row[column.key], column)}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        
        {paginatedData.length === 0 && (
          <Box p="xl" ta="center">
            <Text c="dimmed">
              {filteredAndSortedData.length === 0 
                ? 'No se encontraron datos que coincidan con los filtros'
                : 'No hay datos para mostrar'
              }
            </Text>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="sm"
          />
          <Text size="sm" c="dimmed">
            Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedData.length)} - {Math.min(currentPage * pageSize, filteredAndSortedData.length)} de {filteredAndSortedData.length} registros
          </Text>
        </Group>
      )}

      {/* Summary */}
      {showValidationStatus && (errorCount > 0 || warningCount > 0) && (
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
      )}
    </Stack>
  );
};

export default ExcelDataPreview;