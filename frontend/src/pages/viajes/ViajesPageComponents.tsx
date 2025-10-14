import React from 'react';
import { Grid, Paper, Text, Button, Select } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { DateRangePicker } from '../../components/base/SimpleDateRangePicker';
import SearchInput from '../../components/base/SearchInput';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { calculateViajesStats } from './viajesHelpers';

// Componente separado para renderizar las estadísticas
export function ViajesStatsGrid({
  stats,
}: Readonly<{ stats: ReturnType<typeof calculateViajesStats> }>) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  return (
    <Grid gutter="sm">
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Total
          </Text>
          <Text size="xl" fw={700}>
            {stats.total}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Pendientes
          </Text>
          <Text size="xl" fw={700} c="blue">
            {stats.pendientes}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            En Progreso
          </Text>
          <Text size="xl" fw={700} c="yellow">
            {stats.enProgreso}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={2}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Completados
          </Text>
          <Text size="xl" fw={700} c="green">
            {stats.completados}
          </Text>
        </Paper>
      </Grid.Col>
      <Grid.Col span={4}>
        <Paper p="sm" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Total Facturado
          </Text>
          <Text size="xl" fw={700} c="violet">
            {formatCurrency(stats.totalFacturado)}
          </Text>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

// Componente para filtros principales (primera fila)
function PrimaryFilters({
  search,
  setSearch,
  clienteFilter,
  setClienteFilter,
  estadoFilter,
  setEstadoFilter,
  estadoOptions,
  hasActiveFilters,
  handleClearFilters,
}: Readonly<{
  search: string;
  setSearch: (value: string) => void;
  clienteFilter: string | null;
  setClienteFilter: (value: string | null) => void;
  estadoFilter: string | null;
  setEstadoFilter: (value: string | null) => void;
  estadoOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
}>) {
  return (
    <Grid>
      <Grid.Col span={4}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por número, cliente o ruta..."
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <ClienteSelector
          value={clienteFilter}
          onChange={setClienteFilter}
          placeholder="Filtrar por cliente"
          clearable
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <Select
          value={estadoFilter}
          onChange={setEstadoFilter}
          placeholder="Filtrar por estado"
          data={estadoOptions}
          clearable
        />
      </Grid.Col>
      <Grid.Col span={2}>
        {hasActiveFilters && (
          <Button
            variant="light"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={handleClearFilters}
            fullWidth
          >
            Limpiar
          </Button>
        )}
      </Grid.Col>
    </Grid>
  );
}

// Componente para filtros secundarios (segunda fila)
function SecondaryFilters({
  dateRange,
  setDateRange,
  vehiculoFilter,
  setVehiculoFilter,
  choferFilter,
  setChoferFilter,
}: Readonly<{
  dateRange: [Date | null, Date | null];
  setDateRange: (value: [Date | null, Date | null]) => void;
  vehiculoFilter: string | null;
  setVehiculoFilter: (value: string | null) => void;
  choferFilter: string | null;
  setChoferFilter: (value: string | null) => void;
}>) {
  return (
    <Grid>
      <Grid.Col span={4}>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Filtrar por rango de fechas"
          clearable
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <VehiculoSelector
          value={vehiculoFilter}
          onChange={(value) => setVehiculoFilter(Array.isArray(value) ? value[0] || null : value)}
          placeholder="Filtrar por vehículo"
          clearable
          multiple={false}
        />
      </Grid.Col>
      <Grid.Col span={4}>
        <PersonalSelector
          value={choferFilter}
          onChange={(value) => setChoferFilter(Array.isArray(value) ? value[0] || null : value)}
          placeholder="Filtrar por chofer"
          tipo="Conductor"
          clearable
        />
      </Grid.Col>
    </Grid>
  );
}

// Componente principal para los filtros
export function ViajesFilters({
  search,
  setSearch,
  clienteFilter,
  setClienteFilter,
  estadoFilter,
  setEstadoFilter,
  estadoOptions,
  dateRange,
  setDateRange,
  vehiculoFilter,
  setVehiculoFilter,
  choferFilter,
  setChoferFilter,
  hasActiveFilters,
  handleClearFilters,
}: Readonly<{
  search: string;
  setSearch: (value: string) => void;
  clienteFilter: string | null;
  setClienteFilter: (value: string | null) => void;
  estadoFilter: string | null;
  setEstadoFilter: (value: string | null) => void;
  estadoOptions: { value: string; label: string }[];
  dateRange: [Date | null, Date | null];
  setDateRange: (value: [Date | null, Date | null]) => void;
  vehiculoFilter: string | null;
  setVehiculoFilter: (value: string | null) => void;
  choferFilter: string | null;
  setChoferFilter: (value: string | null) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
}>) {
  return (
    <>
      <PrimaryFilters
        search={search}
        setSearch={setSearch}
        clienteFilter={clienteFilter}
        setClienteFilter={setClienteFilter}
        estadoFilter={estadoFilter}
        setEstadoFilter={setEstadoFilter}
        estadoOptions={estadoOptions}
        hasActiveFilters={hasActiveFilters}
        handleClearFilters={handleClearFilters}
      />
      <SecondaryFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        vehiculoFilter={vehiculoFilter}
        setVehiculoFilter={setVehiculoFilter}
        choferFilter={choferFilter}
        setChoferFilter={setChoferFilter}
      />
    </>
  );
}
