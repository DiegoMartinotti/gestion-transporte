import React from 'react';
import {
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  Badge,
  Card,
  ScrollArea,
  Table,
  ActionIcon,
  Pagination,
  Menu,
  Modal,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
  IconDots,
  IconFileExport,
  IconMaximize,
} from '@tabler/icons-react';
import type { ReportData, TableState } from '../../types/reports';

interface TableControlsProps {
  tableState: TableState;
  onSearch: (term: string) => void;
  onPageSizeChange: (size: number) => void;
  totalRows: number;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TableControls: React.FC<TableControlsProps> = ({
  tableState,
  onSearch,
  onPageSizeChange,
  totalRows,
  onRefresh,
  loading = false,
}) => (
  <Group justify="space-between">
    <Group>
      <TextInput
        placeholder="Buscar en los datos..."
        leftSection={<IconSearch size={16} />}
        value={tableState.searchTerm}
        onChange={(e) => onSearch(e.currentTarget.value)}
        w={300}
      />
      <Select
        placeholder="Filas por página"
        data={[
          { value: '25', label: '25 filas' },
          { value: '50', label: '50 filas' },
          { value: '100', label: '100 filas' },
          { value: '200', label: '200 filas' },
        ]}
        value={String(tableState.pageSize)}
        onChange={(value) => onPageSizeChange(Number(value))}
        w={120}
      />
    </Group>

    <Group>
      <Badge variant="light">{totalRows} registros</Badge>
      {onRefresh && (
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={onRefresh}
          loading={loading}
        >
          Actualizar
        </Button>
      )}
    </Group>
  </Group>
);

interface ReportTableProps {
  data: ReportData | null;
  visibleRows: any[][];
  tableState: TableState;
  onSort: (column: string) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  data,
  visibleRows,
  tableState,
  onSort,
}) => (
  <Card withBorder>
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {data?.headers.map((header) => (
              <Table.Th
                key={header}
                style={{ cursor: 'pointer' }}
                onClick={() => onSort(header)}
              >
                <Group gap="xs">
                  {header}
                  {tableState.sortBy === header && (
                    <ActionIcon
                      variant="transparent"
                      size="xs"
                      c={tableState.sortDirection === 'asc' ? 'blue' : 'red'}
                    >
                      {tableState.sortDirection === 'asc' ? (
                        <IconSortAscending size={14} />
                      ) : (
                        <IconSortDescending size={14} />
                      )}
                    </ActionIcon>
                  )}
                </Group>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleRows.map((row, index) => (
            <Table.Tr key={index}>
              {row.map((cell, cellIndex) => (
                <Table.Td key={cellIndex}>
                  {String(cell)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Card>
);

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => (
  <Group justify="center">
    <Pagination
      value={currentPage}
      onChange={onPageChange}
      total={totalPages}
      siblings={1}
      boundaries={1}
    />
  </Group>
);

interface ReportActionsMenuProps {
  onExport?: () => void;
  onFullscreen: () => void;
}

export const ReportActionsMenu: React.FC<ReportActionsMenuProps> = ({
  onExport,
  onFullscreen,
}) => (
  <Menu shadow="md">
    <Menu.Target>
      <ActionIcon variant="light">
        <IconDots size={16} />
      </ActionIcon>
    </Menu.Target>

    <Menu.Dropdown>
      {onExport && (
        <Menu.Item leftSection={<IconFileExport size={16} />} onClick={onExport}>
          Exportar datos
        </Menu.Item>
      )}
      <Menu.Item leftSection={<IconMaximize size={16} />} onClick={onFullscreen}>
        Pantalla completa
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
);

interface FullscreenModalProps {
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({
  opened,
  onClose,
  children,
  title,
}) => (
  <Modal
    opened={opened}
    onClose={onClose}
    title={title}
    size="100%"
    styles={{
      modal: { height: '100%' },
      body: { height: 'calc(100% - 60px)', overflow: 'hidden' },
    }}
  >
    {children}
  </Modal>
);