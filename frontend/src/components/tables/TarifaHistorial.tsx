import React from 'react';
import { Table, Text, Stack, Paper, Alert } from '@mantine/core';
import TarifaHistorialFilters from './TarifaHistorialFilters';
import TarifaHistorialRow from './TarifaHistorialRow';
import TarifaHistorialStats from './TarifaHistorialStats';
import TarifaHistorialTableHeader from './TarifaHistorialTableHeader';
import { TarifaHistorica } from './helpers/tarifaHistorialHelpers';
import { useTarifaHistorialFilters } from '../../hooks/useTarifaHistorialFilters';

interface TarifaHistorialProps {
  tarifas: TarifaHistorica[];
  readonly?: boolean;
  onEdit?: (tarifa: TarifaHistorica) => void;
  onDelete?: (tarifa: TarifaHistorica) => void;
  onDuplicate?: (tarifa: TarifaHistorica) => void;
  showFilters?: boolean;
}

const TarifaHistorial: React.FC<TarifaHistorialProps> = ({
  tarifas,
  readonly = false,
  onEdit,
  onDelete,
  onDuplicate,
  showFilters = true,
}) => {
  const {
    filterTipo,
    filterMetodo,
    filterVigencia,
    filterFechaDesde,
    filterFechaHasta,
    setFilterTipo,
    setFilterMetodo,
    handleFilterVigenciaChange,
    setFilterFechaDesde,
    setFilterFechaHasta,
    clearFilters,
    sortField,
    sortDirection,
    handleSort,
    filteredTarifas,
    sortedTarifas,
    stats,
  } = useTarifaHistorialFilters(tarifas);

  if (tarifas.length === 0) {
    return (
      <Alert color="yellow" title="Sin tarifas">
        No hay tarifas históricas para mostrar.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {showFilters && (
        <TarifaHistorialFilters
          filterTipo={filterTipo}
          filterMetodo={filterMetodo}
          filterVigencia={filterVigencia}
          filterFechaDesde={filterFechaDesde}
          filterFechaHasta={filterFechaHasta}
          onFilterTipoChange={setFilterTipo}
          onFilterMetodoChange={setFilterMetodo}
          onFilterVigenciaChange={handleFilterVigenciaChange}
          onFilterFechaDesdeChange={setFilterFechaDesde}
          onFilterFechaHastaChange={setFilterFechaHasta}
          onClearFilters={clearFilters}
        />
      )}

      <Paper withBorder>
        <Table striped highlightOnHover>
          <TarifaHistorialTableHeader
            readonly={readonly}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <Table.Tbody>
            {sortedTarifas.map((tarifa) => (
              <TarifaHistorialRow
                key={tarifa._id}
                tarifa={tarifa}
                readonly={readonly}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </Table.Tbody>
        </Table>

        {sortedTarifas.length === 0 && filteredTarifas.length !== tarifas.length && (
          <Paper p="md">
            <Text ta="center" c="dimmed">
              No se encontraron tarifas que coincidan con los filtros aplicados.
            </Text>
          </Paper>
        )}
      </Paper>

      {/* Resumen de tarifas */}
      {showFilters && (
        <TarifaHistorialStats
          totalShowing={sortedTarifas.length}
          totalTarifas={tarifas.length}
          vigentes={stats.vigentes}
          futuras={stats.futuras}
          vencidas={stats.vencidas}
        />
      )}
    </Stack>
  );
};

export default TarifaHistorial;
