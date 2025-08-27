import React from 'react';
import {
  Card,
  Table,
  Button,
  Group,
  ActionIcon,
  Badge,
  Text,
  Stack,
  Alert,
  Paper,
  Grid,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconPlay,
  IconEdit,
  IconTrash,
  IconCopy,
  IconPlus,
  IconInfoCircle,
  IconCalculator,
} from '@tabler/icons-react';
import type { IEscenarioSimulacion, IResultadoSimulacion } from '../../types/tarifa';

interface EscenariosTableProps {
  escenarios: IEscenarioSimulacion[];
  onEdit: (escenario: IEscenarioSimulacion) => void;
  onDelete: (id: string) => void;
  onDuplicate: (escenario: IEscenarioSimulacion) => void;
  onExecute: (escenarios: IEscenarioSimulacion[]) => void;
  simulando: boolean;
}

export const EscenariosTable: React.FC<EscenariosTableProps> = ({
  escenarios,
  onEdit,
  onDelete,
  onDuplicate,
  onExecute,
  simulando,
}) => {
  if (escenarios.length === 0) {
    return (
      <Card>
        <Text c="dimmed" ta="center" py="xl">
          No hay escenarios creados. Crea tu primer escenario para comenzar las simulaciones.
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>Escenarios de Simulación ({escenarios.length})</Text>
        <Button
          leftSection={<IconPlay size={16} />}
          onClick={() => onExecute(escenarios.filter((e) => e.activo))}
          loading={simulando}
          disabled={escenarios.filter((e) => e.activo).length === 0}
        >
          Ejecutar Simulación
        </Button>
      </Group>

      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Tramo</Table.Th>
              <Table.Th>Distancia</Table.Th>
              <Table.Th>Palets</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th width={120}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {escenarios.map((escenario) => (
              <Table.Tr key={escenario.id}>
                <Table.Td>
                  <Text fw={500}>{escenario.nombre}</Text>
                </Table.Td>
                <Table.Td>{escenario.contexto.cliente || '-'}</Table.Td>
                <Table.Td>{escenario.contexto.tramo || '-'}</Table.Td>
                <Table.Td>{escenario.contexto.distancia || 0} km</Table.Td>
                <Table.Td>{escenario.contexto.palets || 0}</Table.Td>
                <Table.Td>
                  <Badge color={escenario.activo ? 'green' : 'gray'} variant="light">
                    {escenario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onEdit(escenario)}
                      title="Editar"
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="green"
                      onClick={() => onDuplicate(escenario)}
                      title="Duplicar"
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => onDelete(escenario.id!)}
                      title="Eliminar"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};

interface ResultadosTableProps {
  resultados: IResultadoSimulacion[];
  onViewDetails: (resultado: IResultadoSimulacion) => void;
}

export const ResultadosTable: React.FC<ResultadosTableProps> = ({
  resultados,
  onViewDetails,
}) => {
  if (resultados.length === 0) {
    return (
      <Alert icon={<IconInfoCircle />} color="blue">
        <Text>
          No hay resultados de simulación disponibles. Ejecuta una simulación para ver los resultados aquí.
        </Text>
      </Alert>
    );
  }

  return (
    <Card withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Escenario</Table.Th>
            <Table.Th>Fecha Ejecución</Table.Th>
            <Table.Th>Método</Table.Th>
            <Table.Th>Tarifa Calculada</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th width={100}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {resultados.map((resultado) => (
            <Table.Tr key={resultado.id}>
              <Table.Td>
                <Text fw={500}>{resultado.escenarioNombre}</Text>
              </Table.Td>
              <Table.Td>
                {new Date(resultado.fechaEjecucion).toLocaleDateString('es-AR')}
              </Table.Td>
              <Table.Td>{resultado.metodoCalculo}</Table.Td>
              <Table.Td>
                <Text fw={500} c="green">
                  ${resultado.tarifaCalculada.toLocaleString('es-AR')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge color="green" variant="light">
                  {resultado.estado}
                </Badge>
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={() => onViewDetails(resultado)}
                  title="Ver detalles"
                >
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
};

interface EscenarioFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (escenario: IEscenarioSimulacion) => void;
  escenario?: IEscenarioSimulacion;
  clientes: any[];
  tramos: any[];
  form: any;
}

export const EscenarioFormModal: React.FC<EscenarioFormModalProps> = ({
  opened,
  onClose,
  onSave,
  escenario,
  clientes,
  tramos,
  form,
}) => {
  const handleSubmit = (values: IEscenarioSimulacion) => {
    onSave(values);
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={escenario ? 'Editar Escenario' : 'Nuevo Escenario'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nombre del Escenario"
            placeholder="Ingresa un nombre descriptivo"
            {...form.getInputProps('nombre')}
            required
          />

          <Divider label="Contexto del Escenario" />

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Cliente"
                placeholder="Selecciona un cliente"
                data={clientes.map((c) => ({ value: c._id, label: c.denominacion }))}
                {...form.getInputProps('contexto.cliente')}
                searchable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Tramo"
                placeholder="Selecciona un tramo"
                data={tramos.map((t) => ({ value: t._id, label: t.denominacion }))}
                {...form.getInputProps('contexto.tramo')}
                searchable
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Distancia (km)"
                placeholder="0"
                {...form.getInputProps('contexto.distancia')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Cantidad de Palets"
                placeholder="0"
                {...form.getInputProps('contexto.palets')}
                min={0}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Tipo de Vehículo"
                placeholder="Selecciona vehículo"
                data={[
                  { value: 'camion', label: 'Camión' },
                  { value: 'camioneta', label: 'Camioneta' },
                  { value: 'semi', label: 'Semirremolque' },
                ]}
                {...form.getInputProps('contexto.vehiculo')}
              />
            </Grid.Col>
          </Grid>

          <DateInput
            label="Fecha del Viaje"
            placeholder="Selecciona la fecha"
            {...form.getInputProps('contexto.fecha')}
          />

          <Divider label="Valores Base" />

          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Tarifa Base ($)"
                placeholder="0"
                {...form.getInputProps('valoresBase.tarifa')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Peajes ($)"
                placeholder="0"
                {...form.getInputProps('valoresBase.peaje')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Extras ($)"
                placeholder="0"
                {...form.getInputProps('valoresBase.extras')}
                min={0}
                decimalScale={2}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" leftSection={<IconPlus size={16} />}>
              {escenario ? 'Guardar Cambios' : 'Crear Escenario'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

interface ResultadoDetalleModalProps {
  opened: boolean;
  onClose: () => void;
  resultado: IResultadoSimulacion | null;
}

export const ResultadoDetalleModal: React.FC<ResultadoDetalleModalProps> = ({
  opened,
  onClose,
  resultado,
}) => {
  if (!resultado) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Detalle de Simulación: ${resultado.escenarioNombre}`}
      size="lg"
    >
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500}>Información General</Text>
            <Badge color="green" variant="light">
              {resultado.estado}
            </Badge>
          </Group>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Fecha de Ejecución</Text>
              <Text fw={500}>{new Date(resultado.fechaEjecucion).toLocaleDateString('es-AR')}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Método de Cálculo</Text>
              <Text fw={500}>{resultado.metodoCalculo}</Text>
            </Grid.Col>
          </Grid>
        </Paper>

        <Paper p="md" withBorder>
          <Text fw={500} mb="md">Desglose de Tarifa</Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text>Tarifa Base:</Text>
              <Text fw={500}>${resultado.desglose.tarifaBase.toLocaleString('es-AR')}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Peajes:</Text>
              <Text fw={500}>${resultado.desglose.peajes.toLocaleString('es-AR')}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Extras:</Text>
              <Text fw={500}>${resultado.desglose.extras.toLocaleString('es-AR')}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Descuentos:</Text>
              <Text fw={500} c="red">-${resultado.desglose.descuentos.toLocaleString('es-AR')}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Impuestos:</Text>
              <Text fw={500}>${resultado.desglose.impuestos.toLocaleString('es-AR')}</Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text fw={700}>Total:</Text>
              <Text fw={700} size="lg" c="green">
                ${resultado.tarifaCalculada.toLocaleString('es-AR')}
              </Text>
            </Group>
          </Stack>
        </Paper>

        <Paper p="md" withBorder>
          <Text fw={500} mb="md">Parámetros de Simulación</Text>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Distancia</Text>
              <Text fw={500}>{resultado.parametros.distancia} km</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Peso</Text>
              <Text fw={500}>{resultado.parametros.peso} kg</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Tipo de Vehículo</Text>
              <Text fw={500}>{resultado.parametros.tipoVehiculo}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Fecha</Text>
              <Text fw={500}>{resultado.parametros.fecha}</Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {resultado.observaciones && (
          <Paper p="md" withBorder>
            <Text fw={500} mb="xs">Observaciones</Text>
            <Text size="sm">{resultado.observaciones}</Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
};