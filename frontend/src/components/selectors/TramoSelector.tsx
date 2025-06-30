import React, { useState, useEffect } from 'react';
import {
  Select,
  Group,
  Text,
  Badge,
  Stack,
  Paper,
  Button,
  Modal,
  Grid,
  Alert,
  ActionIcon,
  Tooltip,
  TextInput,
  MultiSelect,
  Card,
  LoadingOverlay,
  Divider
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconRoad,
  IconCash,
  IconFilter,
  IconRefresh,
  IconCalculator,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconSearch
} from '@tabler/icons-react';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { tramoService, Tramo } from '../../services/tramoService';
import { clienteService } from '../../services/clienteService';
import SearchInput from '../base/SearchInput';

interface TramoSelectorProps {
  value?: string | string[];
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  clienteId?: string;
  origenId?: string;
  destinoId?: string;
  showTarifas?: boolean;
  showDistancia?: boolean;
  filterVigentes?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  clearable?: boolean;
}

const TramoSelector: React.FC<TramoSelectorProps> = ({
  value,
  onChange,
  multiple = false,
  label = 'Tramo',
  placeholder = 'Selecciona un tramo',
  required = false,
  error,
  clienteId,
  origenId,
  destinoId,
  showTarifas = true,
  showDistancia = true,
  filterVigentes = false,
  size = 'sm',
  disabled = false,
  clearable = true
}) => {
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);
  const [selectedTramo, setSelectedTramo] = useState<Tramo | null>(null);
  const [filterModalOpened, { open: openFilterModal, close: closeFilterModal }] = useDisclosure();
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure();

  // Filtros adicionales
  const [filters, setFilters] = useState({
    conTarifa: filterVigentes,
    sinTarifa: false,
    tipos: [] as string[],
    metodos: [] as string[]
  });

  useEffect(() => {
    loadTramos();
  }, [clienteId, origenId, destinoId, debouncedSearch, filters]);

  const loadTramos = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      if (clienteId) params.cliente = clienteId;
      if (origenId) params.origen = origenId;
      if (destinoId) params.destino = destinoId;
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.conTarifa) params.conTarifa = true;
      if (filters.sinTarifa) params.sinTarifa = true;

      const data = await tramoService.getAll(params);
      
      // Filtrar por tipos y métodos si se especificaron
      let filteredData = data;
      if (filters.tipos.length > 0) {
        filteredData = filteredData.filter(tramo => 
          tramo.tarifaVigente && filters.tipos.includes(tramo.tarifaVigente.tipo)
        );
      }
      if (filters.metodos.length > 0) {
        filteredData = filteredData.filter(tramo => 
          tramo.tarifaVigente && filters.metodos.includes(tramo.tarifaVigente.metodoCalculo)
        );
      }

      setTramos(filteredData);
    } catch (error) {
      console.error('Error loading tramos:', error);
      setTramos([]);
    } finally {
      setLoading(false);
    }
  };

  const getTramoLabel = (tramo: Tramo) => {
    const parts = [
      `${tramo.origen.nombre} → ${tramo.destino.nombre}`,
      `(${tramo.cliente.nombre})`
    ];

    if (showDistancia && tramo.distancia > 0) {
      parts.push(`${tramo.distancia}km`);
    }

    if (showTarifas && tramo.tarifaVigente) {
      parts.push(`$${tramo.tarifaVigente.valor}`);
    }

    return parts.join(' ');
  };

  const getTramoData = () => {
    return tramos.map(tramo => ({
      value: tramo._id,
      label: getTramoLabel(tramo),
      tramo
    }));
  };

  const handleTramoSelect = (tramoId: string | string[] | null) => {
    onChange(tramoId);
  };

  const showTramoDetail = (tramoId: string) => {
    const tramo = tramos.find(t => t._id === tramoId);
    if (tramo) {
      setSelectedTramo(tramo);
      openDetailModal();
    }
  };

  const clearFilters = () => {
    setFilters({
      conTarifa: filterVigentes,
      sinTarifa: false,
      tipos: [],
      metodos: []
    });
    setSearchTerm('');
  };

  const getSelectedTramos = (): Tramo[] => {
    if (!value) return [];
    
    const selectedIds = Array.isArray(value) ? value : [value];
    return tramos.filter(tramo => selectedIds.includes(tramo._id));
  };

  const selectedTramos = getSelectedTramos();

  return (
    <Stack gap="xs">
      <Group gap="xs">
        {multiple ? (
          <MultiSelect
            label={label}
            placeholder={placeholder}
            data={getTramoData()}
            value={Array.isArray(value) ? value : (value ? [value] : [])}
            onChange={handleTramoSelect}
            searchable
            clearable={clearable}
            required={required}
            error={error}
            size={size}
            disabled={disabled}
            // loading={loading}
            maxDropdownHeight={300}
            comboboxProps={{ shadow: 'md' }}
          />
        ) : (
          <Select
            label={label}
            placeholder={placeholder}
            data={getTramoData()}
            value={Array.isArray(value) ? value[0] : value}
            onChange={handleTramoSelect}
            searchable
            clearable={clearable}
            required={required}
            error={error}
            size={size}
            disabled={disabled}
            // loading={loading}
            maxDropdownHeight={300}
            comboboxProps={{ shadow: 'md' }}
          />
        )}

        <Group gap="xs" mt={label ? 'xl' : 0}>
          <Tooltip label="Filtros avanzados">
            <ActionIcon
              variant="light"
              onClick={openFilterModal}
              size={size}
            >
              <IconFilter size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Actualizar lista">
            <ActionIcon
              variant="light"
              onClick={loadTramos}
              loading={loading}
              size={size}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>

          {selectedTramos.length === 1 && (
            <Tooltip label="Ver detalle">
              <ActionIcon
                variant="light"
                onClick={() => showTramoDetail(selectedTramos[0]._id)}
                size={size}
              >
                <IconInfoCircle size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Información de tramos seleccionados */}
      {selectedTramos.length > 0 && (
        <Paper p="sm" withBorder bg="gray.0">
          {selectedTramos.length === 1 ? (
            <TramoInfo tramo={selectedTramos[0]} showTarifas={showTarifas} />
          ) : (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {selectedTramos.length} tramos seleccionados
              </Text>
              <Group gap="xs">
                <Text size="xs">
                  Distancia total: {selectedTramos.reduce((sum, t) => sum + t.distancia, 0)} km
                </Text>
                {showTarifas && (
                  <Text size="xs">
                    Costo base: $
                    {selectedTramos.reduce((sum, t) => sum + (t.tarifaVigente?.valor || 0), 0)}
                  </Text>
                )}
              </Group>
            </Stack>
          )}
        </Paper>
      )}

      {/* Estado sin resultados */}
      {!loading && tramos.length === 0 && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
          No se encontraron tramos con los criterios especificados.
        </Alert>
      )}

      {/* Modal de filtros avanzados */}
      <Modal
        opened={filterModalOpened}
        onClose={closeFilterModal}
        title="Filtros Avanzados"
        size="md"
      >
        <Stack gap="md">
          <SearchInput
            placeholder="Buscar por origen, destino o cliente..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs">
                <input
                  type="checkbox"
                  checked={filters.conTarifa}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    conTarifa: e.target.checked
                  }))}
                />
                <Text size="sm">Solo con tarifa vigente</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="xs">
                <input
                  type="checkbox"
                  checked={filters.sinTarifa}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sinTarifa: e.target.checked
                  }))}
                />
                <Text size="sm">Solo sin tarifa</Text>
              </Group>
            </Grid.Col>
          </Grid>

          <MultiSelect
            label="Tipos de tarifa"
            placeholder="Filtrar por tipos"
            data={[
              { value: 'TRMC', label: 'TRMC' },
              { value: 'TRMI', label: 'TRMI' }
            ]}
            value={filters.tipos}
            onChange={(tipos) => setFilters(prev => ({ ...prev, tipos }))}
          />

          <MultiSelect
            label="Métodos de cálculo"
            placeholder="Filtrar por métodos"
            data={[
              { value: 'Kilometro', label: 'Por Kilómetro' },
              { value: 'Palet', label: 'Por Palet' },
              { value: 'Fijo', label: 'Tarifa Fija' }
            ]}
            value={filters.metodos}
            onChange={(metodos) => setFilters(prev => ({ ...prev, metodos }))}
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
            <Button onClick={closeFilterModal}>
              Aplicar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de detalle */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Detalle del Tramo"
        size="lg"
      >
        {selectedTramo && (
          <TramoDetailCard tramo={selectedTramo} />
        )}
      </Modal>
    </Stack>
  );
};

// Componente para mostrar información básica del tramo
const TramoInfo: React.FC<{ tramo: Tramo; showTarifas: boolean }> = ({ tramo, showTarifas }) => (
  <Stack gap="xs">
    <Group justify="space-between">
      <Group gap="xs">
        <IconRoute size={16} />
        <Text size="sm" fw={500}>
          {tramo.origen.nombre} → {tramo.destino.nombre}
        </Text>
      </Group>
      <Group gap="xs">
        <IconRoad size={16} />
        <Text size="sm">{tramo.distancia} km</Text>
      </Group>
    </Group>
    
    {showTarifas && tramo.tarifaVigente && (
      <Group justify="space-between">
        <Group gap="xs">
          <Badge color={tramo.tarifaVigente.tipo === 'TRMC' ? 'blue' : 'green'} size="sm">
            {tramo.tarifaVigente.tipo}
          </Badge>
          <Badge color="gray" size="sm">
            {tramo.tarifaVigente.metodoCalculo}
          </Badge>
        </Group>
        <Group gap="xs">
          <IconCash size={16} />
          <Text size="sm" fw={500}>${tramo.tarifaVigente.valor}</Text>
          {tramo.tarifaVigente.valorPeaje > 0 && (
            <Text size="sm" c="dimmed">+ ${tramo.tarifaVigente.valorPeaje} peaje</Text>
          )}
        </Group>
      </Group>
    )}
  </Stack>
);

// Componente para mostrar detalle completo en modal
const TramoDetailCard: React.FC<{ tramo: Tramo }> = ({ tramo }) => (
  <Stack gap="md">
    <Card withBorder p="md">
      <Grid>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Cliente</Text>
            <Text fw={500}>{tramo.cliente.nombre}</Text>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Distancia</Text>
            <Group gap="xs">
              <IconRoad size={16} />
              <Text fw={500}>{tramo.distancia} km</Text>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>

      <Divider my="md" />

      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconMapPin size={16} color="green" />
            <Text size="sm" c="dimmed">Origen</Text>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={500}>{tramo.origen.nombre}</Text>
            <Text size="xs" c="dimmed">{tramo.origen.direccion}</Text>
          </Stack>
        </Group>

        <Group justify="space-between">
          <Group gap="xs">
            <IconMapPin size={16} color="red" />
            <Text size="sm" c="dimmed">Destino</Text>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={500}>{tramo.destino.nombre}</Text>
            <Text size="xs" c="dimmed">{tramo.destino.direccion}</Text>
          </Stack>
        </Group>
      </Stack>
    </Card>

    {tramo.tarifaVigente && (
      <Card withBorder p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>Tarifa Vigente</Text>
            <Group gap="xs">
              <Badge color={tramo.tarifaVigente.tipo === 'TRMC' ? 'blue' : 'green'}>
                {tramo.tarifaVigente.tipo}
              </Badge>
              <Badge color="gray">
                {tramo.tarifaVigente.metodoCalculo}
              </Badge>
            </Group>
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm">Valor base:</Text>
                <Text fw={500}>${tramo.tarifaVigente.valor}</Text>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group justify="space-between">
                <Text size="sm">Peaje:</Text>
                <Text fw={500}>${tramo.tarifaVigente.valorPeaje}</Text>
              </Group>
            </Grid.Col>
          </Grid>

          <Text size="xs" c="dimmed">
            Vigente del {new Date(tramo.tarifaVigente.vigenciaDesde).toLocaleDateString()} al{' '}
            {new Date(tramo.tarifaVigente.vigenciaHasta).toLocaleDateString()}
          </Text>
        </Stack>
      </Card>
    )}

    {!tramo.tarifaVigente && (
      <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
        Este tramo no tiene una tarifa vigente configurada.
      </Alert>
    )}
  </Stack>
);

export default TramoSelector;