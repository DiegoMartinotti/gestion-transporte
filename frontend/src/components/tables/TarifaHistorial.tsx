import React, { useState } from 'react';
import {
  Table,
  Badge,
  Text,
  Group,
  ActionIcon,
  Menu,
  Stack,
  Paper,
  Button,
  Select,
  Grid,
  Alert
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconDots,
  IconHistory,
  IconCalendar,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconCash,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';

interface TarifaHistorica {
  _id: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

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
  showFilters = true
}) => {
  const [sortField, setSortField] = useState<keyof TarifaHistorica>('vigenciaDesde');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterMetodo, setFilterMetodo] = useState<string>('');
  const [filterVigencia, setFilterVigencia] = useState<'vigente' | 'vencida' | 'futura' | ''>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState<string | null>(null);
  const [filterFechaHasta, setFilterFechaHasta] = useState<string | null>(null);

  const getTarifaStatus = (tarifa: TarifaHistorica) => {
    const now = new Date();
    const desde = new Date(tarifa.vigenciaDesde);
    const hasta = new Date(tarifa.vigenciaHasta);

    if (now < desde) {
      return { status: 'futura', color: 'blue', label: 'Futura', icon: IconCalendar };
    } else if (now > hasta) {
      return { status: 'vencida', color: 'gray', label: 'Vencida', icon: IconX };
    } else {
      return { status: 'vigente', color: 'green', label: 'Vigente', icon: IconCheck };
    }
  };

  const handleSort = (field: keyof TarifaHistorica) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof TarifaHistorica) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <IconSortAscending size={14} /> : <IconSortDescending size={14} />;
  };

  // Filtrar tarifas
  const filteredTarifas = tarifas.filter(tarifa => {
    const matchesTipo = !filterTipo || tarifa.tipo === filterTipo;
    const matchesMetodo = !filterMetodo || tarifa.metodoCalculo === filterMetodo;
    
    let matchesVigencia = true;
    if (filterVigencia) {
      const status = getTarifaStatus(tarifa).status;
      matchesVigencia = status === filterVigencia;
    }

    let matchesFechas = true;
    if (filterFechaDesde || filterFechaHasta) {
      const desde = new Date(tarifa.vigenciaDesde);
      const hasta = new Date(tarifa.vigenciaHasta);
      
      if (filterFechaDesde && desde < new Date(filterFechaDesde)) matchesFechas = false;
      if (filterFechaHasta && hasta > new Date(filterFechaHasta)) matchesFechas = false;
    }

    return matchesTipo && matchesMetodo && matchesVigencia && matchesFechas;
  });

  // Ordenar tarifas
  const sortedTarifas = filteredTarifas.sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Convertir fechas para comparación
    if (sortField === 'vigenciaDesde' || sortField === 'vigenciaHasta') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const clearFilters = () => {
    setFilterTipo('');
    setFilterMetodo('');
    setFilterVigencia('');
    setFilterFechaDesde(null);
    setFilterFechaHasta(null);
  };

  const tipoOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'TRMC', label: 'TRMC' },
    { value: 'TRMI', label: 'TRMI' }
  ];

  const metodoOptions = [
    { value: '', label: 'Todos los métodos' },
    { value: 'Kilometro', label: 'Por Kilómetro' },
    { value: 'Palet', label: 'Por Palet' },
    { value: 'Fijo', label: 'Tarifa Fija' }
  ];

  const vigenciaOptions = [
    { value: '', label: 'Todas las vigencias' },
    { value: 'vigente', label: 'Solo vigentes' },
    { value: 'vencida', label: 'Solo vencidas' },
    { value: 'futura', label: 'Solo futuras' }
  ];

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
        <Paper p="md" withBorder>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                label="Tipo"
                placeholder="Filtrar por tipo"
                data={tipoOptions}
                value={filterTipo}
                onChange={(value) => setFilterTipo(value || '')}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                label="Método"
                placeholder="Filtrar por método"
                data={metodoOptions}
                value={filterMetodo}
                onChange={(value) => setFilterMetodo(value || '')}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                label="Vigencia"
                placeholder="Filtrar por vigencia"
                data={vigenciaOptions}
                value={filterVigencia}
                onChange={(value) => setFilterVigencia(value as any || '')}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <DateInput
                label="Desde"
                placeholder="Fecha desde"
                value={filterFechaDesde}
                onChange={(value) => setFilterFechaDesde(value)}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <DateInput
                label="Hasta"
                placeholder="Fecha hasta"
                value={filterFechaHasta}
                onChange={(value) => setFilterFechaHasta(value)}
                size="sm"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Button
                variant="outline"
                leftSection={<IconFilter size={16} />}
                onClick={clearFilters}
                size="sm"
                mt="xl"
              >
                Limpiar
              </Button>
            </Grid.Col>
          </Grid>
        </Paper>
      )}

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('tipo')}>
                  <Text size="sm" fw={500}>Tipo</Text>
                  {getSortIcon('tipo')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('metodoCalculo')}>
                  <Text size="sm" fw={500}>Método</Text>
                  {getSortIcon('metodoCalculo')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('valor')}>
                  <Text size="sm" fw={500}>Valor</Text>
                  {getSortIcon('valor')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('valorPeaje')}>
                  <Text size="sm" fw={500}>Peaje</Text>
                  {getSortIcon('valorPeaje')}
                </Group>
              </Table.Th>
              <Table.Th>
                <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => handleSort('vigenciaDesde')}>
                  <Text size="sm" fw={500}>Vigencia</Text>
                  {getSortIcon('vigenciaDesde')}
                </Group>
              </Table.Th>
              <Table.Th>Estado</Table.Th>
              {!readonly && <Table.Th>Acciones</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sortedTarifas.map((tarifa) => {
              const status = getTarifaStatus(tarifa);
              const StatusIcon = status.icon;

              return (
                <Table.Tr key={tarifa._id}>
                  <Table.Td>
                    <Badge color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'} size="sm">
                      {tarifa.tipo}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{tarifa.metodoCalculo}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconCash size={14} />
                      <Text size="sm" fw={500}>${tarifa.valor}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">${tarifa.valorPeaje}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="xs">
                        {new Date(tarifa.vigenciaDesde).toLocaleDateString()}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(tarifa.vigenciaHasta).toLocaleDateString()}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <StatusIcon size={14} color={status.color} />
                      <Badge color={status.color} size="sm">
                        {status.label}
                      </Badge>
                    </Group>
                  </Table.Td>
                  {!readonly && (
                    <Table.Td>
                      <Menu withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {onEdit && (
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => onEdit(tarifa)}
                            >
                              Editar
                            </Menu.Item>
                          )}
                          {onDuplicate && (
                            <Menu.Item
                              leftSection={<IconHistory size={14} />}
                              onClick={() => onDuplicate(tarifa)}
                            >
                              Duplicar
                            </Menu.Item>
                          )}
                          {onDelete && (
                            <>
                              <Menu.Divider />
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => onDelete(tarifa)}
                              >
                                Eliminar
                              </Menu.Item>
                            </>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  )}
                </Table.Tr>
              );
            })}
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
        <Paper p="sm" withBorder bg="gray.0">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Mostrando {sortedTarifas.length} de {tarifas.length} tarifas
            </Text>
            <Group gap="md">
              <Group gap="xs">
                <IconCheck size={14} color="green" />
                <Text size="sm">
                  {sortedTarifas.filter(t => getTarifaStatus(t).status === 'vigente').length} vigentes
                </Text>
              </Group>
              <Group gap="xs">
                <IconCalendar size={14} color="blue" />
                <Text size="sm">
                  {sortedTarifas.filter(t => getTarifaStatus(t).status === 'futura').length} futuras
                </Text>
              </Group>
              <Group gap="xs">
                <IconX size={14} color="gray" />
                <Text size="sm">
                  {sortedTarifas.filter(t => getTarifaStatus(t).status === 'vencida').length} vencidas
                </Text>
              </Group>
            </Group>
          </Group>
        </Paper>
      )}
    </Stack>
  );
};

export default TarifaHistorial;