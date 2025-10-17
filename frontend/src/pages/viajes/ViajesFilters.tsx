import React from 'react';
import { Grid, Select, Button } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import SearchInput from '../../components/base/SearchInput';
import { DateRangePicker } from '../../components/base/SimpleDateRangePicker';
import { ClienteSelector } from '../../components/selectors/ClienteSelector';
import { VehiculoSelector } from '../../components/selectors/VehiculoSelector';
import { PersonalSelector } from '../../components/selectors/PersonalSelector';
import { estadoOptions } from './helpers/viajesPageHelpers';

type MantineDateRangeValue = [string | null, string | null];

interface ViajesFiltersProps {
  search: string;
  clienteFilter: string | null;
  estadoFilter: string | null;
  dateRange: [Date | null, Date | null];
  vehiculoFilter: string | null;
  choferFilter: string | null;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onClienteFilterChange: (value: string | null) => void;
  onEstadoFilterChange: (value: string | null) => void;
  onDateRangeChange: (value: [Date | null, Date | null]) => void;
  onVehiculoFilterChange: (value: string | null) => void;
  onChoferFilterChange: (value: string | null) => void;
  onClearFilters: () => void;
}

const ViajesFilters: React.FC<ViajesFiltersProps> = ({
  search,
  clienteFilter,
  estadoFilter,
  dateRange,
  vehiculoFilter,
  choferFilter,
  hasActiveFilters,
  onSearchChange,
  onClienteFilterChange,
  onEstadoFilterChange,
  onDateRangeChange,
  onVehiculoFilterChange,
  onChoferFilterChange,
  onClearFilters,
}) => {
  // Mantine expone el rango como fechas, pero el wrapper tipado exige strings; hacemos cast controlado.
  const dateRangeValue = dateRange as unknown as MantineDateRangeValue;
  const handleDateRangeChange = (value: MantineDateRangeValue) => {
    onDateRangeChange(value as unknown as [Date | null, Date | null]);
  };

  return (
    <>
      <Grid>
        <Grid.Col span={4}>
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar por número, cliente o ruta..."
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <ClienteSelector
            value={clienteFilter}
            onChange={onClienteFilterChange}
            placeholder="Filtrar por cliente"
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            value={estadoFilter}
            onChange={onEstadoFilterChange}
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
              onClick={onClearFilters}
              fullWidth
            >
              Limpiar
            </Button>
          )}
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={4}>
          <DateRangePicker
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            placeholder="Filtrar por rango de fechas"
            clearable
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <VehiculoSelector
            value={vehiculoFilter}
            onChange={(value) =>
              onVehiculoFilterChange(Array.isArray(value) ? value[0] || null : value)
            }
            placeholder="Filtrar por vehículo"
            clearable
            multiple={false}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <PersonalSelector
            value={choferFilter}
            onChange={(value) =>
              onChoferFilterChange(Array.isArray(value) ? value[0] || null : value)
            }
            placeholder="Filtrar por chofer"
            tipo="Conductor"
            clearable
          />
        </Grid.Col>
      </Grid>
    </>
  );
};

export default ViajesFilters;
