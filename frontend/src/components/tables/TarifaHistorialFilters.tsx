import React from 'react';
import { Grid, Select, Button, Paper } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconFilter } from '@tabler/icons-react';

interface TarifaHistorialFiltersProps {
  filterTipo: string;
  filterMetodo: string;
  filterVigencia: string;
  filterFechaDesde: string | null;
  filterFechaHasta: string | null;
  onFilterTipoChange: (value: string) => void;
  onFilterMetodoChange: (value: string) => void;
  onFilterVigenciaChange: (value: string) => void;
  onFilterFechaDesdeChange: (value: string | null) => void;
  onFilterFechaHastaChange: (value: string | null) => void;
  onClearFilters: () => void;
}

const TarifaHistorialFilters: React.FC<TarifaHistorialFiltersProps> = ({
  filterTipo,
  filterMetodo,
  filterVigencia,
  filterFechaDesde,
  filterFechaHasta,
  onFilterTipoChange,
  onFilterMetodoChange,
  onFilterVigenciaChange,
  onFilterFechaDesdeChange,
  onFilterFechaHastaChange,
  onClearFilters,
}) => {
  const tipoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'TRMC', label: 'TRMC' },
    { value: 'TRMI', label: 'TRMI' },
  ];

  const metodoOptions = [
    { value: '', label: 'Todos los métodos' },
    { value: 'Kilometro', label: 'Por Kilómetro' },
    { value: 'Palet', label: 'Por Palet' },
    { value: 'Fijo', label: 'Tarifa Fija' },
  ];

  const vigenciaOptions = [
    { value: '', label: 'Todas las vigencias' },
    { value: 'vigente', label: 'Solo vigentes' },
    { value: 'vencida', label: 'Solo vencidas' },
    { value: 'futura', label: 'Solo futuras' },
  ];

  return (
    <Paper p="md" withBorder>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Select
            label="Tipo"
            placeholder="Filtrar por tipo"
            data={tipoOptions}
            value={filterTipo}
            onChange={(value) => onFilterTipoChange(value || '')}
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Select
            label="Método"
            placeholder="Filtrar por método"
            data={metodoOptions}
            value={filterMetodo}
            onChange={(value) => onFilterMetodoChange(value || '')}
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Select
            label="Vigencia"
            placeholder="Filtrar por vigencia"
            data={vigenciaOptions}
            value={filterVigencia}
            onChange={(value) => onFilterVigenciaChange(value || '')}
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <DateInput
            label="Desde"
            placeholder="Fecha desde"
            value={filterFechaDesde}
            onChange={onFilterFechaDesdeChange}
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <DateInput
            label="Hasta"
            placeholder="Fecha hasta"
            value={filterFechaHasta}
            onChange={onFilterFechaHastaChange}
            size="sm"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Button
            variant="outline"
            leftSection={<IconFilter size={16} />}
            onClick={onClearFilters}
            size="sm"
            mt="xl"
          >
            Limpiar
          </Button>
        </Grid.Col>
      </Grid>
    </Paper>
  );
};

export default TarifaHistorialFilters;
