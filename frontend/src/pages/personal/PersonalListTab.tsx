import React from 'react';
import { Card, Group, LoadingOverlay, Pagination } from '@mantine/core';
import type { Personal, PersonalFilters, Empresa } from '../../types';
import PersonalFiltersComponent from '../../components/personal/PersonalFilters';
import DataTable from '../../components/base/DataTable';

interface PersonalListTabProps {
  filters: Omit<PersonalFilters, 'page' | 'limit'>;
  empresas: Empresa[];
  personal: Personal[];
  columns: Array<{
    key: string;
    label: string;
    render: (person: Personal) => React.ReactNode;
  }>;
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onFilterChange: (key: string, value: unknown) => void;
  onRefresh: () => Promise<void>;
  onPageChange: (page: number) => void;
}

export const PersonalListTab: React.FC<PersonalListTabProps> = ({
  filters,
  empresas,
  personal,
  columns,
  loading,
  currentPage,
  totalPages,
  onFilterChange,
  onRefresh,
  onPageChange,
}) => {
  return (
    <>
      {/* Filters */}
      <PersonalFiltersComponent
        filters={filters}
        empresas={empresas}
        onFilterChange={onFilterChange}
        onRefresh={onRefresh}
        loading={loading}
      />

      {/* Personal List */}
      <Card withBorder>
        <LoadingOverlay visible={loading} />
        <DataTable
          data={personal}
          columns={columns}
          loading={loading}
          emptyMessage="No se encontró personal"
        />

        {totalPages > 1 && (
          <Group justify="center" mt="lg">
            <Pagination value={currentPage} onChange={onPageChange} total={totalPages} size="sm" />
          </Group>
        )}
      </Card>
    </>
  );
};
