import React from 'react';
import { Card, Group, Select } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

interface FiltersCardProps {
  statusFilter: string;
  tipoFilter: string;
  onStatusFilterChange: (value: string) => void;
  onTipoFilterChange: (value: string) => void;
}

export const FiltersCard: React.FC<FiltersCardProps> = ({
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
          data={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'expired', label: 'Vencidos' },
            { value: 'expiring', label: 'Por vencer' },
            { value: 'valid', label: 'Vigentes' },
          ]}
          leftSection={<IconFilter size={16} />}
        />
        <Select
          label="Tipo de Personal"
          value={tipoFilter}
          onChange={(value) => onTipoFilterChange(value || 'all')}
          data={[
            { value: 'all', label: 'Todos los tipos' },
            { value: 'Conductor', label: 'Conductor' },
            { value: 'Administrativo', label: 'Administrativo' },
            { value: 'Mecánico', label: 'Mecánico' },
            { value: 'Supervisor', label: 'Supervisor' },
            { value: 'Otro', label: 'Otro' },
          ]}
          leftSection={<IconFilter size={16} />}
        />
      </Group>
    </Card>
  );
};
