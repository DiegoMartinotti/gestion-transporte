import React from 'react';
import {
  Table,
  Group,
  Text,
  TextInput,
  Select,
  Pagination,
  Badge,
  Skeleton,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { DataTableColumn } from './DataTableHelpers';

// Loading skeleton component
export const LoadingSkeleton = <T,>({
  columns,
  multiSelect,
}: {
  columns: DataTableColumn<T>[];
  multiSelect: boolean;
}) => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <Table.Tr key={index}>
        {multiSelect && (
          <Table.Td>
            <Skeleton height={20} width={20} />
          </Table.Td>
        )}
        {columns.map((column) => (
          <Table.Td key={column.key}>
            <Skeleton height={20} />
          </Table.Td>
        ))}
      </Table.Tr>
    ))}
  </>
);

// Search and controls component
export const SearchAndControls: React.FC<{
  showSearch: boolean;
  searchPlaceholder: string;
  search: string;
  handleSearchChange: (value: string) => void;
  multiSelect: boolean;
  selectedIds: string[];
  showPageSize: boolean;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions: Array<{ value: string; label: string }>;
}> = ({
  showSearch,
  searchPlaceholder,
  search,
  handleSearchChange,
  multiSelect,
  selectedIds,
  showPageSize,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
}) => {
  if (!showSearch) return null;

  return (
    <Group justify="space-between">
      <Group gap="md">
        <TextInput
          placeholder={searchPlaceholder}
          leftSection={<IconSearch size="1rem" />}
          value={search}
          onChange={(e) => handleSearchChange(e.currentTarget.value)}
          style={{ minWidth: 300 }}
        />

        {multiSelect && selectedIds.length > 0 && (
          <Badge variant="light" color="blue">
            {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </Group>

      {showPageSize && (
        <Group gap="xs">
          <Text size="sm">Mostrar:</Text>
          <Select
            value={pageSize.toString()}
            onChange={(value) => onPageSizeChange?.(parseInt(value || '10'))}
            data={pageSizeOptions}
            size="sm"
            w={80}
          />
        </Group>
      )}
    </Group>
  );
};

// Pagination component
export const PaginationControls: React.FC<{
  showPagination: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
}> = ({ showPagination, totalPages, currentPage, onPageChange }) => {
  if (!showPagination || totalPages <= 1) return null;

  return (
    <Group justify="center" mt="md">
      <Pagination
        value={currentPage}
        onChange={onPageChange}
        total={totalPages}
        size="sm"
        withEdges
      />
    </Group>
  );
};