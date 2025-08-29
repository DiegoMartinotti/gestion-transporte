import React from 'react';
import { Grid, Select } from '@mantine/core';
import SearchInput from '../../../components/base/SearchInput';
import DateRangePicker from '../../../components/base/DateRangePicker';
import type { OrdenCompraFilter } from '../../../types/ordenCompra';
import type { Cliente } from '../../../types/cliente';
import { ESTADOS_OPTIONS } from '../helpers/ordenesCompraHelpers';

interface OrdenesCompraFiltersProps {
  filters: OrdenCompraFilter;
  onFiltersChange: (filters: OrdenCompraFilter) => void;
  clientes: Cliente[];
}

export const OrdenesCompraFilters = ({
  filters,
  onFiltersChange,
  clientes,
}: OrdenesCompraFiltersProps) => {
  const clienteOptions = [
    { value: '', label: 'Todos los clientes' },
    ...clientes.map((cliente) => ({
      value: cliente._id,
      label: cliente.nombre,
    })),
  ];

  const updateFilter = (key: keyof OrdenCompraFilter, value: string | Date[] | null) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Grid>
      <Grid.Col span={3}>
        <SearchInput
          placeholder="Buscar por número..."
          value={filters.search || ''}
          onChange={(value) => updateFilter('search', value)}
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <Select
          placeholder="Todos los estados"
          data={ESTADOS_OPTIONS}
          value={filters.estado || ''}
          onChange={(value) => updateFilter('estado', value)}
          clearable
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <Select
          placeholder="Todos los clientes"
          data={clienteOptions}
          value={filters.cliente || ''}
          onChange={(value) => updateFilter('cliente', value)}
          clearable
          searchable
        />
      </Grid.Col>
      <Grid.Col span={3}>
        <DateRangePicker
          placeholder="Rango de fechas"
          value={filters.fechaDesde && filters.fechaHasta ? [new Date(filters.fechaDesde), new Date(filters.fechaHasta)] : [null, null]}
          onChange={(dates) => {
            if (dates[0] && dates[1]) {
              updateFilter('fechaDesde', dates[0].toISOString().split('T')[0]);
              updateFilter('fechaHasta', dates[1].toISOString().split('T')[0]);
            } else {
              updateFilter('fechaDesde', null);
              updateFilter('fechaHasta', null);
            }
          }}
        />
      </Grid.Col>
    </Grid>
  );
};