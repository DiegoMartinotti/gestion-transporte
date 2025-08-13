import React from 'react';
import { Card, Group, Select } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';
import { STATUS_FILTER_OPTIONS, TIPO_FILTER_OPTIONS } from './helpers/documentacionHelpers';

interface DocumentFiltersProps {
  statusFilter: string;
  tipoFilter: string;
  onStatusFilterChange: (value: string) => void;
  onTipoFilterChange: (value: string) => void;
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  statusFilter,
  tipoFilter,
  onStatusFilterChange,
  onTipoFilterChange,
}) => {
  return (
    <Card withBorder p="md">
      <Group>
        <Select
          label="Estado"
          value={statusFilter}
          onChange={(value) => onStatusFilterChange(value || 'all')}
          data={STATUS_FILTER_OPTIONS}
          leftSection={<IconFilter size={16} />}
        />
        <Select
          label="Tipo de Personal"
          value={tipoFilter}
          onChange={(value) => onTipoFilterChange(value || 'all')}
          data={TIPO_FILTER_OPTIONS}
          leftSection={<IconFilter size={16} />}
        />
      </Group>
    </Card>
  );
};
