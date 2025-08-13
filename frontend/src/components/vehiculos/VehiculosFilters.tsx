import { Card, Group, Title, Text, TextInput, Select, ActionIcon } from '@mantine/core';
import { IconFilter, IconSearch, IconList, IconLayoutGrid } from '@tabler/icons-react';
import { VehiculoFilter, VehiculoTipo } from '../../types/vehiculo';
import { Empresa } from '../../types';
import { VEHICULOS_CONSTANTS } from '../../constants/vehiculos';

interface VehiculosFiltersProps {
  filters: VehiculoFilter;
  onFiltersChange: (filters: Partial<VehiculoFilter>) => void;
  empresas: Empresa[];
  viewMode: 'list' | 'cards';
  onViewModeChange: (mode: 'list' | 'cards') => void;
}

export const VehiculosFilters = ({
  filters,
  onFiltersChange,
  empresas,
  viewMode,
  onViewModeChange,
}: VehiculosFiltersProps) => (
  <Card withBorder mb="md">
    <Group justify="space-between" mb="md">
      <Title order={4}>
        <Group gap="sm">
          <IconFilter size={20} />
          Filtros
        </Group>
      </Title>
      <Group gap="sm">
        <Text size="sm" c="dimmed">
          Vista:
        </Text>
        <ActionIcon
          variant={viewMode === 'list' ? 'filled' : 'light'}
          color="blue"
          onClick={() => onViewModeChange('list')}
        >
          <IconList size={16} />
        </ActionIcon>
        <ActionIcon
          variant={viewMode === 'cards' ? 'filled' : 'light'}
          color="blue"
          onClick={() => onViewModeChange('cards')}
        >
          <IconLayoutGrid size={16} />
        </ActionIcon>
      </Group>
    </Group>
    <Group>
      <TextInput
        placeholder={VEHICULOS_CONSTANTS.MESSAGES.SEARCH_PLACEHOLDER}
        leftSection={<IconSearch size={16} />}
        value={filters.search || ''}
        onChange={(e) => onFiltersChange({ search: e.target.value })}
        style={{ flex: 1 }}
      />
      <Select
        placeholder="Empresa"
        data={empresas
          .filter((e: Empresa) => e._id)
          .map((e: Empresa) => ({ value: e._id as string, label: e.nombre }))}
        value={filters.empresa || null}
        onChange={(value) => onFiltersChange({ empresa: value || undefined })}
        clearable
      />
      <Select
        placeholder="Tipo"
        data={VEHICULOS_CONSTANTS.TIPOS.map((tipo) => ({ value: tipo, label: tipo }))}
        value={filters.tipo || null}
        onChange={(value) => onFiltersChange({ tipo: (value as VehiculoTipo) || undefined })}
        clearable
      />
      <Select
        placeholder="Estado"
        data={VEHICULOS_CONSTANTS.ESTADO_OPTIONS}
        value={filters.activo?.toString() || null}
        onChange={(value) => onFiltersChange({ activo: value ? value === 'true' : undefined })}
        clearable
      />
    </Group>
  </Card>
);
