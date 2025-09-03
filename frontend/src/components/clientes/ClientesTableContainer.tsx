import { Paper } from '@mantine/core';
import { DataTable, DataTableColumn } from '../base';
import VirtualizedDataTable from '../base/VirtualizedDataTable';
import { Cliente, ClienteFilters } from '../../types';

interface ClientesTableContainerProps {
  columns: DataTableColumn<Cliente>[];
  data: Cliente[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  useVirtualScrolling: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onFiltersChange: (filters: ClienteFilters) => void;
}

export function ClientesTableContainer({
  columns,
  data,
  loading,
  totalItems,
  currentPage,
  pageSize,
  useVirtualScrolling,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
}: ClientesTableContainerProps) {
  return (
    <Paper>
      {useVirtualScrolling ? (
        <VirtualizedDataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          searchPlaceholder="Buscar clientes..."
          emptyMessage="No se encontraron clientes"
          height={600}
          itemHeight={60}
          onFiltersChange={onFiltersChange}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onFiltersChange={onFiltersChange}
          searchPlaceholder="Buscar clientes..."
          emptyMessage="No se encontraron clientes"
        />
      )}
    </Paper>
  );
}
