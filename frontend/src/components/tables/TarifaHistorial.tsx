import React, { useState } from 'react';
import { Table, Text, Group, Stack, Paper, Alert } from '@mantine/core';
import { IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import TarifaHistorialFilters from './TarifaHistorialFilters';
import TarifaHistorialRow from './TarifaHistorialRow';
import TarifaHistorialStats from './TarifaHistorialStats';
import {
  TarifaHistorica,
  filterTarifas,
  sortTarifas,
  calculateStats,
} from './helpers/tarifaHistorialHelpers';

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
  const [sortField, setSortField] = useState<keyof TarifaHistorica>('vigenciaDesde');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterMetodo, setFilterMetodo] = useState<string>('');
  const [filterVigencia, setFilterVigencia] = useState<'vigente' | 'vencida' | 'futura' | ''>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<string | null>(null);
  const [filterFechaHasta, setFilterFechaHasta] = useState<string | null>(null);

  const handleSort = (field: keyof TarifaHistorica) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterVigenciaChange = (value: string) => {
    setFilterVigencia(value as 'vigente' | 'vencida' | 'futura' | '');
  };

  const getSortIcon = (field: keyof TarifaHistorica) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  };

  // Filtrar y ordenar tarifas
  const filteredTarifas = filterTarifas(tarifas, {
    tipo: filterTipo,
    metodo: filterMetodo,
    vigencia: filterVigencia,
    fechaDesde: filterFechaDesde,
    fechaHasta: filterFechaHasta,
  });

  const sortedTarifas = sortTarifas(filteredTarifas, sortField, sortDirection);

  // Calcular estadísticas
  const stats = calculateStats(sortedTarifas);

  const clearFilters = () => {
    setFilterTipo('');
    setFilterMetodo('');
    setFilterVigencia('');
    setFilterFechaDesde(null);
    setFilterFechaHasta(null);
  };

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
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('tipo')}>
                  <Text size="sm" fw={500}>
                    Tipo
                  </Text>
                  {getSortIcon('tipo')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group
                  gap="xs"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('metodoCalculo')}
                >
                  <Text size="sm" fw={500}>
                    Método
                  </Text>
                  {getSortIcon('metodoCalculo')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('valor')}>
                  <Text size="sm" fw={500}>
                    Valor
                  </Text>
                  {getSortIcon('valor')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group
                  gap="xs"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('valorPeaje')}
                >
                  <Text size="sm" fw={500}>
                    Peaje
                  </Text>
                  {getSortIcon('valorPeaje')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group
                  gap="xs"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('vigenciaDesde')}
                >
                  <Text size="sm" fw={500}>
                    Vigencia
                  </Text>
                  {getSortIcon('vigenciaDesde')}
                </Group>
              </Table.Th>
              <Table.Th>Estado</Table.Th>
              {!readonly && <Table.Th>Acciones</Table.Th>}
            </Table.Tr>
          </Table.Thead>
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
