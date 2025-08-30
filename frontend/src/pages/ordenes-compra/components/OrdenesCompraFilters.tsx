import React from 'react';
import { Card, Grid, Select } from '@mantine/core';
import SearchInput from '../../../components/base/SearchInput';
import type { OrdenCompraFilter } from '../../../types/ordenCompra';
import type { Cliente } from '../../../types/cliente';

interface OrdenesCompraFiltersProps {
  filters: OrdenCompraFilter;
  onFiltersChange: (filters: OrdenCompraFilter) => void;
  clientes: Cliente[];
}

const ESTADOS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Facturada', label: 'Facturada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

/**
 * Componente de filtros para la tabla de órdenes de compra
 */
export const OrdenesCompraFilters: React.FC<OrdenesCompraFiltersProps> = ({
  filters,
  onFiltersChange,
  clientes,
}) => {
  const updateFilter = (key: keyof OrdenCompraFilter, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Card>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <SearchInput
            placeholder="Buscar por número..."
            value={filters.numero || ''}
            onChange={(value: string) => updateFilter('numero', value)}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Cliente"
            placeholder="Seleccionar cliente"
            value={filters.cliente || ''}
            onChange={(value) => updateFilter('cliente', value)}
            data={[
              { value: '', label: 'Todos los clientes' },
              ...clientes.map((cliente) => ({
                value: cliente._id,
                label: cliente.nombre,
              })),
            ]}
            searchable
            clearable
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Select
            label="Estado"
            placeholder="Estado"
            value={filters.estado || ''}
            onChange={(value) => updateFilter('estado', value)}
            data={ESTADOS_OPTIONS}
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
};
