import React from 'react';
import { Grid, Select, ActionIcon, Tooltip, Card } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { SearchInput } from '../base';

interface PersonalFiltersProps {
  filters: {
    search?: string;
    tipo?: string;
    empresa?: string;
    activo?: boolean;
  };
  empresas: Array<{ _id: string; nombre: string }>;
  onFilterChange: (key: string, value: unknown) => void;
  onRefresh: () => void;
  loading: boolean;
}

const PersonalFilters: React.FC<PersonalFiltersProps> = ({
  filters,
  empresas,
  onFilterChange,
  onRefresh,
  loading,
}) => {
  const tipoOptions = [
    { value: '', label: 'Todos' },
    { value: 'Conductor', label: 'Conductor' },
    { value: 'Administrativo', label: 'Administrativo' },
    { value: 'Mecánico', label: 'Mecánico' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Otro', label: 'Otro' },
  ];

  const empresaOptions = [
    { value: '', label: 'Todas' },
    ...empresas.map((emp) => ({ value: emp._id, label: emp.nombre })),
  ];

  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  return (
    <Card withBorder p="md" mb="lg">
      <Grid>
        <Grid.Col span={4}>
          <SearchInput
            placeholder="Buscar por nombre, DNI o legajo..."
            value={filters.search || ''}
            onChange={(value) => onFilterChange('search', value)}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select
            label="Tipo"
            placeholder="Todos"
            value={filters.tipo || ''}
            onChange={(value) => onFilterChange('tipo', value || undefined)}
            data={tipoOptions}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Empresa"
            placeholder="Todas"
            value={filters.empresa || ''}
            onChange={(value) => onFilterChange('empresa', value || undefined)}
            data={empresaOptions}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <Select
            label="Estado"
            value={filters.activo?.toString() || ''}
            onChange={(value) =>
              onFilterChange('activo', value === '' ? undefined : value === 'true')
            }
            data={estadoOptions}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <div style={{ marginTop: '24px' }}>
            <Tooltip label="Actualizar">
              <ActionIcon onClick={onRefresh} loading={loading}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </div>
        </Grid.Col>
      </Grid>
    </Card>
  );
};

export default PersonalFilters;
