import React, { useCallback } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  Badge,
  Center,
  Skeleton,
  Box,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconSelector,
} from '@tabler/icons-react';
import { DataTableColumn } from './DataTable';

// Types
export interface RowData<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  data: T[];
}

export interface VirtualizedTableControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  displayCount: number;
  onDisplayCountChange: (count: number) => void;
  processedDataLength: number;
  totalDataLength: number;
}

export interface VirtualizedHeaderProps<T = Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}

export interface VirtualizedRowProps<T = Record<string, unknown>> {
  index: number;
  style: React.CSSProperties;
  data: RowData<T>;
}

// Utility functions
export const getValueFromRecord = <T,>(record: T, key: string): unknown => {
  return (record as Record<string, unknown>)[key];
};

// Components
export const LoadingSkeleton = <T,>({
  columns,
  itemHeight,
}: {
  columns: DataTableColumn<T>[];
  itemHeight: number;
}) => (
  <Paper withBorder>
    <Stack gap={0}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Group
          key={index}
          gap={0}
          style={{ minHeight: itemHeight, paddingLeft: rem(12), paddingRight: rem(12) }}
        >
          {columns.map((column) => (
            <Box
              key={column.key}
              style={{
                flex: column.width ? `0 0 ${column.width}` : '1',
                padding: `${rem(8)} ${rem(12)}`,
              }}
            >
              <Skeleton height={16} />
            </Box>
          ))}
        </Group>
      ))}
    </Stack>
  </Paper>
);

export const EmptyState = ({ height, emptyMessage }: { height: number; emptyMessage: string }) => (
  <Paper withBorder style={{ minHeight: height }}>
    <Center style={{ height: height }}>
      <Text c="dimmed">{emptyMessage}</Text>
    </Center>
  </Paper>
);

export const VirtualizedTableControls: React.FC<VirtualizedTableControlsProps> = ({
  search,
  onSearchChange,
  searchPlaceholder,
  displayCount,
  onDisplayCountChange,
  processedDataLength,
  totalDataLength,
}) => (
  <Group justify="space-between">
    <TextInput
      placeholder={searchPlaceholder}
      leftSection={<IconSearch size="0.9rem" />}
      value={search}
      onChange={(e) => onSearchChange(e.currentTarget.value)}
      style={{ minWidth: 200 }}
    />

    <Group gap="xs">
      <Text size="sm" c="dimmed">
        Mostrando {processedDataLength} de {totalDataLength}
      </Text>
      <Select
        size="xs"
        value={displayCount.toString()}
        onChange={(value) => onDisplayCountChange(parseInt(value || '100'))}
        data={[
          { value: '100', label: '100' },
          { value: '250', label: '250' },
          { value: '500', label: '500' },
          { value: '1000', label: '1000' },
        ]}
        style={{ width: 80 }}
      />
    </Group>
  </Group>
);

export const VirtualizedRow = <T,>({ index, style, data }: VirtualizedRowProps<T>) => {
  const { columns, data: tableData } = data;
  const record = tableData[index];

  const renderCell = useCallback((column: DataTableColumn<T>, record: T) => {
    const value = getValueFromRecord(record, column.key);

    if (column.render) {
      return column.render(record);
    }

    if (typeof value === 'boolean') {
      return (
        <Badge color={value ? 'green' : 'red'} variant="light" size="sm">
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('es-AR');
    }

    return value?.toString() || '-';
  }, []);

  return (
    <div style={style}>
      <Group
        gap={0}
        style={{
          borderBottom: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: index % 2 === 0 ? 'var(--mantine-color-gray-0)' : 'transparent',
          height: '100%',
          alignItems: 'center',
          paddingLeft: rem(12),
          paddingRight: rem(12),
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.key}
            style={{
              flex: column.width ? `0 0 ${column.width}` : '1',
              textAlign: column.align || 'left',
              padding: `${rem(8)} ${rem(12)}`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Text size="sm" lineClamp={1}>
              {renderCell(column, record)}
            </Text>
          </Box>
        ))}
      </Group>
    </div>
  );
};

export const VirtualizedHeader = <T,>({
  columns,
  sortBy,
  sortOrder,
  onSort,
}: VirtualizedHeaderProps<T>) => {
  const getSortIcon = useCallback(
    (columnKey: string) => {
      if (sortBy !== columnKey) {
        return <IconSelector size="0.9rem" />;
      }
      return sortOrder === 'asc' ? (
        <IconSortAscending size="0.9rem" />
      ) : (
        <IconSortDescending size="0.9rem" />
      );
    },
    [sortBy, sortOrder]
  );

  return (
    <Group
      gap={0}
      style={{
        borderBottom: '2px solid var(--mantine-color-gray-4)',
        backgroundColor: 'var(--mantine-color-gray-1)',
        minHeight: rem(42),
        paddingLeft: rem(12),
        paddingRight: rem(12),
      }}
    >
      {columns.map((column) => (
        <Box
          key={column.key}
          style={{
            flex: column.width ? `0 0 ${column.width}` : '1',
            padding: `${rem(8)} ${rem(12)}`,
          }}
        >
          {column.sortable ? (
            <UnstyledButton
              onClick={() => onSort(column.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(4),
                width: '100%',
                justifyContent:
                  column.align === 'center'
                    ? 'center'
                    : column.align === 'right'
                      ? 'flex-end'
                      : 'flex-start',
              }}
            >
              <Text fw={600} size="sm">
                {column.label}
              </Text>
              {getSortIcon(column.key)}
            </UnstyledButton>
          ) : (
            <Text
              fw={600}
              size="sm"
              style={{
                textAlign: column.align || 'left',
                width: '100%',
              }}
            >
              {column.label}
            </Text>
          )}
        </Box>
      ))}
    </Group>
  );
};
