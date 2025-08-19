import React from 'react';
import { Card, Grid, Select, TextInput, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { EstadoPartida } from '../../../types/ordenCompra';
import { FiltrosReporte } from '../types';

interface PartidaFiltersProps {
  filtros: FiltrosReporte;
  onFiltrosChange: (filtros: FiltrosReporte) => void;
}

const handleDateChange =
  (
    filtros: FiltrosReporte,
    onFiltrosChange: (filtros: FiltrosReporte) => void,
    field: 'fechaDesde' | 'fechaHasta'
  ) =>
  (date: string | null) => {
    onFiltrosChange({
      ...filtros,
      [field]: date ? new Date(date) : undefined,
    });
  };

export const PartidaFilters: React.FC<PartidaFiltersProps> = ({ filtros, onFiltrosChange }) => {
  const estadoOptions = [
    { value: 'abierta', label: 'Abierta' },
    { value: 'pagada', label: 'Pagada' },
    { value: 'vencida', label: 'Vencida' },
  ];

  const handleEstadoChange = (value: string | null) => {
    onFiltrosChange({
      ...filtros,
      estadoPartida: (value as EstadoPartida) || undefined,
    });
  };

  const handleClienteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltrosChange({
      ...filtros,
      cliente: event.target.value,
    });
  };

  return (
    <Card withBorder mb="md">
      <Title order={6} mb="sm">
        Filtros
      </Title>
      <Grid>
        <Grid.Col span={3}>
          <Select
            label="Estado"
            placeholder="Todos los estados"
            data={estadoOptions}
            value={filtros.estadoPartida || ''}
            onChange={handleEstadoChange}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Cliente"
            placeholder="Buscar por cliente..."
            value={filtros.cliente || ''}
            onChange={handleClienteChange}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <DatePickerInput
            label="Fecha Desde"
            placeholder="Seleccionar fecha"
            value={filtros.fechaDesde || null}
            onChange={handleDateChange(filtros, onFiltrosChange, 'fechaDesde')}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <DatePickerInput
            label="Fecha Hasta"
            placeholder="Seleccionar fecha"
            value={filtros.fechaHasta || null}
            onChange={handleDateChange(filtros, onFiltrosChange, 'fechaHasta')}
            clearable
          />
        </Grid.Col>
      </Grid>
    </Card>
  );
};
