import React, { useState, useEffect } from 'react';
import {
  Stack,
  Grid,
  Button,
  Group,
  Text,
  Select,
  NumberInput,
  Paper,
  Title,
  Badge,
  Alert,
  Tabs,
  Table,
  ActionIcon,
  Modal,
  Divider
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconRoad,
  IconCalculator,
  IconPlus,
  IconTrash,
  IconEdit,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { tramoService } from '../../services/tramoService';
import TarifaForm from './TarifaForm';

interface Site {
  _id: string;
  nombre: string;
  direccion: string;
  cliente: string;
  location?: {
    coordinates: [number, number];
  };
}

interface Cliente {
  _id: string;
  nombre: string;
}

interface TarifaHistorica {
  _id?: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

interface Tramo {
  _id: string;
  origen: {
    _id: string;
    nombre: string;
  };
  destino: {
    _id: string;
    nombre: string;
  };
  cliente: {
    _id: string;
    nombre: string;
  };
  distancia: number;
  tarifasHistoricas: TarifaHistorica[];
}

interface TramoFormProps {
  tramo?: Tramo | null;
  clientes: Cliente[];
  sites: Site[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TramoForm: React.FC<TramoFormProps> = ({
  tramo,
  clientes,
  sites,
  onSubmit,
  onCancel
}) => {
  const [sitesFiltered, setSitesFiltered] = useState<Site[]>([]);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [selectedTarifa, setSelectedTarifa] = useState<TarifaHistorica | null>(null);
  const [tarifaIndex, setTarifaIndex] = useState<number>(-1);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [validatingConflicts, setValidatingConflicts] = useState(false);

  const [tarifaModalOpened, { open: openTarifaModal, close: closeTarifaModal }] = useDisclosure();

  const form = useForm({
    initialValues: {
      cliente: tramo?.cliente._id || '',
      origen: tramo?.origen._id || '',
      destino: tramo?.destino._id || '',
      distancia: tramo?.distancia || 0,
      tarifasHistoricas: tramo?.tarifasHistoricas || []
    },
    validate: {
      cliente: (value) => (!value ? 'Cliente es requerido' : null),
      origen: (value) => (!value ? 'Origen es requerido' : null),
      destino: (value) => (!value ? 'Destino es requerido' : null),
      distancia: (value) => (value <= 0 ? 'Distancia debe ser mayor a 0' : null)
    }
  });

  // Filtrar sites por cliente seleccionado
  useEffect(() => {
    if (form.values.cliente) {
      const filtered = sites.filter(site => site.cliente === form.values.cliente);
      setSitesFiltered(filtered);
      
      // Limpiar origen y destino si no pertenecen al cliente seleccionado
      if (form.values.origen && !filtered.find(s => s._id === form.values.origen)) {
        form.setFieldValue('origen', '');
      }
      if (form.values.destino && !filtered.find(s => s._id === form.values.destino)) {
        form.setFieldValue('destino', '');
      }
    } else {
      setSitesFiltered([]);
    }
  }, [form.values.cliente, sites, form]);

  // Calcular distancia automáticamente
  const calculateDistance = async () => {
    if (!form.values.origen || !form.values.destino) {
      notifications.show({
        title: 'Error',
        message: 'Selecciona origen y destino para calcular distancia',
        color: 'red'
      });
      return;
    }

    const origenSite = sitesFiltered.find(s => s._id === form.values.origen);
    const destinoSite = sitesFiltered.find(s => s._id === form.values.destino);

    if (!origenSite?.location?.coordinates || !destinoSite?.location?.coordinates) {
      notifications.show({
        title: 'Error',
        message: 'Los sitios seleccionados no tienen coordenadas válidas',
        color: 'red'
      });
      return;
    }

    setCalculatingDistance(true);
    try {
      // Simular cálculo de distancia (en implementación real usaríamos Google Maps API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cálculo aproximado usando coordenadas
      const lat1 = origenSite.location.coordinates[1];
      const lon1 = origenSite.location.coordinates[0];
      const lat2 = destinoSite.location.coordinates[1];
      const lon2 = destinoSite.location.coordinates[0];

      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      form.setFieldValue('distancia', Math.round(distance));
      
      notifications.show({
        title: 'Éxito',
        message: `Distancia calculada: ${Math.round(distance)} km`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al calcular distancia',
        color: 'red'
      });
    } finally {
      setCalculatingDistance(false);
    }
  };

  // Validar conflictos de tarifas
  const validateTarifaConflicts = async () => {
    if (!form.values.cliente || !form.values.origen || !form.values.destino) return;

    setValidatingConflicts(true);
    try {
      const result = await tramoService.validarConflictosTarifas({
        origen: form.values.origen,
        destino: form.values.destino,
        cliente: form.values.cliente,
        tarifasHistoricas: form.values.tarifasHistoricas
      });

      setConflicts(result.conflicts || []);
    } catch (error) {
      console.error('Error validating conflicts:', error);
    } finally {
      setValidatingConflicts(false);
    }
  };

  // Validar conflictos cuando cambien las tarifas
  useEffect(() => {
    if (form.values.tarifasHistoricas.length > 0) {
      validateTarifaConflicts();
    }
  }, [form.values.tarifasHistoricas, validateTarifaConflicts]);

  const handleAddTarifa = () => {
    setSelectedTarifa(null);
    setTarifaIndex(-1);
    openTarifaModal();
  };

  const handleEditTarifa = (tarifa: TarifaHistorica, index: number) => {
    setSelectedTarifa(tarifa);
    setTarifaIndex(index);
    openTarifaModal();
  };

  const handleDeleteTarifa = (index: number) => {
    const newTarifas = [...form.values.tarifasHistoricas];
    newTarifas.splice(index, 1);
    form.setFieldValue('tarifasHistoricas', newTarifas);
  };

  const handleTarifaSubmit = (tarifaData: Omit<TarifaHistorica, '_id'>) => {
    const newTarifas = [...form.values.tarifasHistoricas];
    
    if (tarifaIndex >= 0) {
      // Editar tarifa existente
      newTarifas[tarifaIndex] = { ...newTarifas[tarifaIndex], ...tarifaData };
    } else {
      // Agregar nueva tarifa
      newTarifas.push(tarifaData as TarifaHistorica);
    }
    
    form.setFieldValue('tarifasHistoricas', newTarifas);
    closeTarifaModal();
  };

  const handleSubmit = (values: any) => {
    if (conflicts.length > 0) {
      notifications.show({
        title: 'Error',
        message: 'Hay conflictos en las tarifas que deben resolverse',
        color: 'red'
      });
      return;
    }

    onSubmit(values);
  };

  const origenSite = sitesFiltered.find(s => s._id === form.values.origen);
  const destinoSite = sitesFiltered.find(s => s._id === form.values.destino);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Tabs defaultValue="basico">
          <Tabs.List>
            <Tabs.Tab value="basico">Datos Básicos</Tabs.Tab>
            <Tabs.Tab value="tarifas">
              Tarifas ({form.values.tarifasHistoricas.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basico">
            <Paper p="md" withBorder>
              <Title order={4} mb="md">
                <Group>
                  <IconRoute size={20} />
                  Información del Tramo
                </Group>
              </Title>

              <Grid>
                <Grid.Col span={12}>
                  <Select
                    label="Cliente"
                    placeholder="Selecciona un cliente"
                    data={clientes.map(c => ({ value: c._id, label: c.nombre }))}
                    {...form.getInputProps('cliente')}
                    searchable
                    required
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label="Origen"
                    placeholder="Selecciona origen"
                    data={sitesFiltered.map(s => ({ 
                      value: s._id, 
                      label: `${s.nombre} - ${s.direccion}` 
                    }))}
                    {...form.getInputProps('origen')}
                    searchable
                    required
                    disabled={!form.values.cliente}
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label="Destino"
                    placeholder="Selecciona destino"
                    data={sitesFiltered.filter(s => s._id !== form.values.origen).map(s => ({ 
                      value: s._id, 
                      label: `${s.nombre} - ${s.direccion}` 
                    }))}
                    {...form.getInputProps('destino')}
                    searchable
                    required
                    disabled={!form.values.cliente}
                  />
                </Grid.Col>

                {origenSite && destinoSite && (
                  <Grid.Col span={12}>
                    <Paper p="sm" withBorder bg="gray.0">
                      <Group justify="space-between">
                        <Group>
                          <IconMapPin size={16} color="green" />
                          <Text size="sm">{origenSite.nombre}</Text>
                          <IconRoad size={16} />
                          <IconMapPin size={16} color="red" />
                          <Text size="sm">{destinoSite.nombre}</Text>
                        </Group>
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconCalculator size={14} />}
                          onClick={calculateDistance}
                          loading={calculatingDistance}
                        >
                          Calcular Distancia
                        </Button>
                      </Group>
                    </Paper>
                  </Grid.Col>
                )}

                <Grid.Col span={6}>
                  <NumberInput
                    label="Distancia (km)"
                    placeholder="Distancia en kilómetros"
                    min={0}
                    step={0.1}
                    decimalScale={1}
                    {...form.getInputProps('distancia')}
                    required
                  />
                </Grid.Col>
              </Grid>

            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="tarifas">
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Tarifas Históricas</Title>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddTarifa}
                    size="sm"
                  >
                    Agregar Tarifa
                  </Button>
                </Group>

                {conflicts.length > 0 && (
                  <Alert 
                    icon={<IconAlertTriangle size={16} />} 
                    color="red" 
                    mb="md"
                    title="Conflictos Detectados"
                  >
                    <Stack gap="xs">
                      {conflicts.map((conflict, index) => (
                        <Text key={index} size="sm">
                          • {conflict.message}
                        </Text>
                      ))}
                    </Stack>
                  </Alert>
                )}

                {form.values.tarifasHistoricas.length === 0 ? (
                  <Alert color="yellow" title="Sin tarifas">
                    Este tramo no tiene tarifas configuradas. Agrega al menos una tarifa para poder calcular costos.
                  </Alert>
                ) : (
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Método</Table.Th>
                        <Table.Th>Valor</Table.Th>
                        <Table.Th>Peaje</Table.Th>
                        <Table.Th>Vigencia</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {form.values.tarifasHistoricas.map((tarifa, index) => {
                        const now = new Date();
                        const desde = new Date(tarifa.vigenciaDesde);
                        const hasta = new Date(tarifa.vigenciaHasta);
                        const vigente = desde <= now && hasta >= now;

                        return (
                          <Table.Tr key={index}>
                            <Table.Td>
                              <Badge color={tarifa.tipo === 'TRMC' ? 'blue' : 'green'}>
                                {tarifa.tipo}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{tarifa.metodoCalculo}</Table.Td>
                            <Table.Td>${tarifa.valor}</Table.Td>
                            <Table.Td>${tarifa.valorPeaje}</Table.Td>
                            <Table.Td>
                              <Text size="xs">
                                {new Date(tarifa.vigenciaDesde).toLocaleDateString()} - {' '}
                                {new Date(tarifa.vigenciaHasta).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={vigente ? 'green' : 'gray'} size="sm">
                                {vigente ? 'Vigente' : 'No vigente'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  onClick={() => handleEditTarifa(tarifa, index)}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDeleteTarifa(index)}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                )}
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Divider />

        <Group justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            loading={validatingConflicts}
            disabled={conflicts.length > 0}
          >
            {tramo ? 'Actualizar' : 'Crear'} Tramo
          </Button>
        </Group>
      </Stack>

      {/* Modal para formulario de tarifa */}
      <Modal
        opened={tarifaModalOpened}
        onClose={closeTarifaModal}
        title={selectedTarifa ? 'Editar Tarifa' : 'Nueva Tarifa'}
        size="lg"
      >
        <TarifaForm
          tarifa={selectedTarifa}
          onSubmit={handleTarifaSubmit}
          onCancel={closeTarifaModal}
          existingTarifas={form.values.tarifasHistoricas}
        />
      </Modal>
    </form>
  );
};

export default TramoForm;