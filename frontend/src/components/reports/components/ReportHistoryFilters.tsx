import React from 'react';
import { Group, TextInput, Select, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconRefresh } from '@tabler/icons-react';
import { ReportDefinition, ExportFormat, ReportExecutionStatus } from '../../../types/reports';
import { HistoryFilters } from '../hooks/useReportHistoryState';

interface ReportHistoryFiltersProps {
  filters: HistoryFilters;
  reportDefinitions: ReportDefinition[];
  onFiltersChange: (filters: Partial<HistoryFilters>) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'running', label: 'Ejecutando' },
  { value: 'completed', label: 'Completado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'cancelled', label: 'Cancelado' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'image', label: 'Imagen' },
];

export const ReportHistoryFilters: React.FC<ReportHistoryFiltersProps> = ({
  filters,
  reportDefinitions,
  onFiltersChange,
  onRefresh,
  loading = false,
}) => (
  <Group wrap="wrap" gap="md">
    <TextInput
      placeholder="Buscar por nombre o usuario..."
      leftSection={<IconSearch size={16} />}
      value={filters.searchTerm}
      onChange={(e) => onFiltersChange({ searchTerm: e.currentTarget.value })}
      w={250}
    />

    <Select
      placeholder="Reporte"
      data={reportDefinitions.map((r) => ({ value: r.id, label: r.name }))}
      value={filters.reportId}
      onChange={(value) => onFiltersChange({ reportId: value || undefined })}
      clearable
      w={200}
    />

    <Select
      placeholder="Estado"
      data={STATUS_OPTIONS}
      value={filters.status}
      onChange={(value) =>
        onFiltersChange({ status: (value as ReportExecutionStatus) || undefined })
      }
      clearable
      w={140}
    />

    <Select
      placeholder="Formato"
      data={FORMAT_OPTIONS}
      value={filters.format}
      onChange={(value) => onFiltersChange({ format: (value as ExportFormat) || undefined })}
      clearable
      w={120}
    />

    <DatePickerInput
      placeholder="Desde"
      value={filters.startDate}
      onChange={(value) => onFiltersChange({ startDate: (value as unknown as Date) || undefined })}
      clearable
      w={140}
    />

    <DatePickerInput
      placeholder="Hasta"
      value={filters.endDate}
      onChange={(value) => onFiltersChange({ endDate: (value as unknown as Date) || undefined })}
      clearable
      w={140}
    />

    <Button
      variant="light"
      leftSection={<IconRefresh size={16} />}
      onClick={onRefresh}
      loading={loading}
    >
      Actualizar
    </Button>
  </Group>
);
