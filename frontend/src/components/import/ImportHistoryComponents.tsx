// Componentes refactorizados de ImportHistory para reducir complejidad
import React from 'react';
import {
  Group,
  TextInput,
  Select,
  Button,
  Card,
  Text,
  SimpleGrid,
  Badge,
  Title,
  Stack,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconSearch, IconFilter, IconX, IconDownload } from '@tabler/icons-react';
import { ImportStats } from './ImportHistoryTypes';

// Componente de estadísticas de importación
export const ImportHistoryStats: React.FC<{ stats: ImportStats }> = ({ stats }) => (
  <Card withBorder p="md" mb="md">
    <Title order={4} mb="sm">
      Estadísticas de Importaciones
    </Title>
    <SimpleGrid cols={4} spacing="md">
      <div>
        <Text size="lg" fw={700} c="blue">
          {stats.totalImports}
        </Text>
        <Text size="sm" c="dimmed">
          Total Importaciones
        </Text>
      </div>
      <div>
        <Text size="lg" fw={700} c="green">
          {stats.successfulImports}
        </Text>
        <Text size="sm" c="dimmed">
          Exitosas
        </Text>
      </div>
      <div>
        <Text size="lg" fw={700} c="red">
          {stats.failedImports}
        </Text>
        <Text size="sm" c="dimmed">
          Fallidas
        </Text>
      </div>
      <div>
        <Text size="lg" fw={700}>
          {Math.round(stats.averageSuccessRate)}%
        </Text>
        <Text size="sm" c="dimmed">
          Tasa Promedio Éxito
        </Text>
      </div>
    </SimpleGrid>
  </Card>
);

// Componente de filtros
interface ImportHistoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEntity: string;
  setFilterEntity: (entity: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  onClearFilters: () => void;
  onExportAll?: () => void;
}

// Opciones de filtros constantes
const ENTITY_OPTIONS = [
  { value: 'all', label: 'Todas las entidades' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'sites', label: 'Sites' },
  { value: 'tramos', label: 'Tramos' },
  { value: 'viajes', label: 'Viajes' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'personal', label: 'Personal' },
  { value: 'extras', label: 'Extras' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'completed', label: 'Completado' },
  { value: 'failed', label: 'Fallido' },
];

// Helper para verificar filtros activos
const hasActiveFilters = (
  searchTerm: string,
  filterEntity: string,
  filterStatus: string,
  dateRange: [Date | null, Date | null]
): boolean => {
  return (
    searchTerm !== '' ||
    filterEntity !== 'all' ||
    filterStatus !== 'all' ||
    dateRange[0] !== null ||
    dateRange[1] !== null
  );
};

// Componente para header de filtros
const FilterHeader: React.FC<{
  hasFilters: boolean;
  onClearFilters: () => void;
  onExportAll?: () => void;
}> = ({ hasFilters, onClearFilters, onExportAll }) => (
  <Group justify="space-between" mb="sm">
    <Title order={5}>Filtros</Title>
    <Group gap="xs">
      {hasFilters && (
        <Button
          variant="light"
          size="xs"
          onClick={onClearFilters}
          leftSection={<IconX size={14} />}
        >
          Limpiar
        </Button>
      )}
      {onExportAll && (
        <Button size="xs" leftSection={<IconDownload size={14} />} onClick={onExportAll}>
          Exportar Todo
        </Button>
      )}
    </Group>
  </Group>
);

// Componente para controles de filtros
const FilterControls: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterEntity: string;
  setFilterEntity: (entity: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
}> = ({
  searchTerm,
  setSearchTerm,
  filterEntity,
  setFilterEntity,
  filterStatus,
  setFilterStatus,
  dateRange,
  setDateRange,
}) => (
  <Stack gap="sm">
    <Group grow>
      <TextInput
        placeholder="Buscar por archivo o usuario..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
      />
    </Group>
    <Group grow>
      <Select
        data={ENTITY_OPTIONS}
        value={filterEntity}
        onChange={(value: string | null) => setFilterEntity(value || 'all')}
        leftSection={<IconFilter size={16} />}
        placeholder="Filtrar por entidad"
      />
      <Select
        data={STATUS_OPTIONS}
        value={filterStatus}
        onChange={(value: string | null) => setFilterStatus(value || 'all')}
        placeholder="Filtrar por estado"
      />
    </Group>
    <Group grow>
      <DatePickerInput
        placeholder="Fecha desde"
        value={dateRange[0]}
        onChange={(value: Date | null) => setDateRange([value, dateRange[1]])}
        clearable
      />
      <DatePickerInput
        placeholder="Fecha hasta"
        value={dateRange[1]}
        onChange={(value: Date | null) => setDateRange([dateRange[0], value])}
        clearable
      />
    </Group>
  </Stack>
);

// Componente para badges de filtros activos
const ActiveFiltersBadges: React.FC<{
  searchTerm: string;
  filterEntity: string;
  filterStatus: string;
  dateRange: [Date | null, Date | null];
}> = ({ searchTerm, filterEntity, filterStatus, dateRange }) => (
  <Group gap="xs">
    {searchTerm && (
      <Badge variant="light" size="sm">
        Búsqueda: &quot;{searchTerm}&quot;
      </Badge>
    )}
    {filterEntity !== 'all' && (
      <Badge variant="light" size="sm" color="blue">
        Entidad: {filterEntity}
      </Badge>
    )}
    {filterStatus !== 'all' && (
      <Badge variant="light" size="sm" color="green">
        Estado: {filterStatus}
      </Badge>
    )}
    {(dateRange[0] || dateRange[1]) && (
      <Badge variant="light" size="sm" color="orange">
        Fecha filtrada
      </Badge>
    )}
  </Group>
);

export const ImportHistoryFilters: React.FC<ImportHistoryFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterEntity,
  setFilterEntity,
  filterStatus,
  setFilterStatus,
  dateRange,
  setDateRange,
  onClearFilters,
  onExportAll,
}) => {
  const filtersActive = hasActiveFilters(searchTerm, filterEntity, filterStatus, dateRange);

  return (
    <Card withBorder p="md" mb="md">
      <FilterHeader
        hasFilters={filtersActive}
        onClearFilters={onClearFilters}
        onExportAll={onExportAll}
      />
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterEntity={filterEntity}
        setFilterEntity={setFilterEntity}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      {filtersActive && (
        <ActiveFiltersBadges
          searchTerm={searchTerm}
          filterEntity={filterEntity}
          filterStatus={filterStatus}
          dateRange={dateRange}
        />
      )}
    </Card>
  );
};
