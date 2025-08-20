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
  Divider,
} from '@mantine/core';
import {
  IconRoute,
  IconMapPin,
  IconRoad,
  IconCalculator,
  IconPlus,
  IconTrash,
  IconEdit,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { Site, Cliente, Tramo } from '../../types';
import TarifaForm from './TarifaForm';
import { tramoValidationRules, getInitialTramoValues } from './validation/tramoValidation';
import {
  calculateDistance,
  validateTarifaConflicts,
  filterSitesByClient,
} from './helpers/tramoHelpers';

interface TarifaHistorica {
  _id?: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

interface TramoFormProps {
  tramo?: Tramo | null;
  clientes: Cliente[];
  sites: Site[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const TramoForm: React.FC<TramoFormProps> = ({ tramo, clientes, sites, onSubmit, onCancel }) => {
  const [sitesFiltered, setSitesFiltered] = useState<Site[]>([]);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [selectedTarifa, setSelectedTarifa] = useState<TarifaHistorica | null>(null);
  const [tarifaIndex, setTarifaIndex] = useState<number>(-1);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [validatingConflicts, setValidatingConflicts] = useState(false);

  const [tarifaModalOpened, { open: openTarifaModal, close: closeTarifaModal }] = useDisclosure();

  const form = useForm({
    initialValues: getInitialTramoValues(tramo),
    validate: tramoValidationRules,
  });

  // Filtrar sites por cliente seleccionado
  useEffect(() => {
    filterSitesByClient(form.values.cliente, sites, form, setSitesFiltered);
  }, [form.values.cliente, sites]);

  // Calcular distancia automáticamente
  const handleCalculateDistance = async () => {
    await calculateDistance(
      form.values.origen,
      form.values.destino,
      sitesFiltered,
      setCalculatingDistance,
      (distance) => form.setFieldValue('distancia', distance)
    );
  };

  // Validar conflictos de tarifas
  const handleValidateTarifaConflicts = async () => {
    await validateTarifaConflicts(form.values, setConflicts, setValidatingConflicts);
  };

  // Validar conflictos cuando cambien las tarifas
  useEffect(() => {
    if (form.values.tarifasHistoricas.length > 0) {
      handleValidateTarifaConflicts();
    }
  }, [form.values.tarifasHistoricas]);

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
        color: 'red',
      });
      return;
    }

    onSubmit(values);
  };

  const origenSite = sitesFiltered.find((s) => s._id === form.values.origen);
  const destinoSite = sitesFiltered.find((s) => s._id === form.values.destino);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Tabs defaultValue="basico">
          <Tabs.List>
            <Tabs.Tab value="basico">Datos Básicos</Tabs.Tab>
            <Tabs.Tab value="tarifas">Tarifas ({form.values.tarifasHistoricas.length})</Tabs.Tab>
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
                    data={clientes.map((c) => ({ value: c._id, label: c.nombre }))}
                    {...form.getInputProps('cliente')}
                    searchable
                    required
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <Select
                    label="Origen"
                    placeholder="Selecciona origen"
                    data={sitesFiltered.map((s) => ({
                      value: s._id,
                      label: `${s.nombre} - ${s.direccion || 'Sin dirección'}`,
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
                    data={sitesFiltered
                      .filter((s) => s._id !== form.values.origen)
                      .map((s) => ({
                        value: s._id,
                        label: `${s.nombre} - ${s.direccion || 'Sin dirección'}`,
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
                          onClick={handleCalculateDistance}
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
                  <Button leftSection={<IconPlus size={16} />} onClick={handleAddTarifa} size="sm">
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
                    Este tramo no tiene tarifas configuradas. Agrega al menos una tarifa para poder
                    calcular costos.
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
                      {form.values.tarifasHistoricas.map(
                        (tarifa: TarifaHistorica, index: number) => {
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
                                  {new Date(tarifa.vigenciaDesde).toLocaleDateString()} -{' '}
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
                        }
                      )}
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
          <Button type="submit" loading={validatingConflicts} disabled={conflicts.length > 0}>
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
