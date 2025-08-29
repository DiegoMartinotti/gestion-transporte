import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Card,
  Title,
  Text,
  NumberInput,
  ActionIcon,
  Table,
  Badge,
  Divider,
  Alert,
  Paper,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconPlus,
  IconTrash,
  IconCurrencyDollar,
  IconInfoCircle,
  IconCalculator,
} from '@tabler/icons-react';
import { ClienteSelector } from '../../selectors/ClienteSelector';
import { ViajeAssigner } from '../ViajeAssigner';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../../utils/viajeHelpers';
import { formatCurrency } from '../helpers/ordenCompraHelpers';
import type {
  OrdenCompraFormContentProps,
  InformacionBasicaCardProps,
  ViajesCardProps,
  ViajesTableProps,
  ActionsCardProps,
} from '../types/ordenCompraTypes';

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Facturada', label: 'Facturada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

export function OrdenCompraFormContent({
  form,
  showViajeAssigner,
  setShowViajeAssigner,
  viajesDisponibles,
  loadingViajes,
  loading,
  initialData,
  onCancel,
  handleSubmit,
  handleAddViaje,
  handleRemoveViaje,
  handleUpdateImporte,
  calculateTotal,
  getViajeInfo,
}: OrdenCompraFormContentProps) {
  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <InformacionBasicaCard form={form} />
        <ViajesCard
          form={form}
          loadingViajes={loadingViajes}
          setShowViajeAssigner={setShowViajeAssigner}
          handleRemoveViaje={handleRemoveViaje}
          handleUpdateImporte={handleUpdateImporte}
          calculateTotal={calculateTotal}
          getViajeInfo={getViajeInfo}
        />
        <ActionsCard onCancel={onCancel} loading={loading} initialData={initialData} />
      </Stack>
      {showViajeAssigner && (
        <ViajeAssigner
          opened={showViajeAssigner}
          onClose={() => setShowViajeAssigner(false)}
          clienteId={form.values.cliente}
          viajesDisponibles={viajesDisponibles}
          viajesExcluidos={form.values.viajes.map((v) => v.viaje)}
          onAssign={handleAddViaje}
        />
      )}
    </form>
  );
}

export function InformacionBasicaCard({ form }: InformacionBasicaCardProps) {
  return (
    <Card>
      <Title order={4} mb="md">
        Información Básica
      </Title>
      <Stack gap="md">
        <Group grow>
          <TextInput
            label="Número de OC"
            placeholder="Ej: OC-2024-001"
            required
            {...form.getInputProps('numero')}
          />
          <Select
            label="Estado"
            placeholder="Seleccionar estado"
            data={ESTADOS}
            required
            {...form.getInputProps('estado')}
          />
        </Group>
        <Group grow>
          <ClienteSelector
            label="Cliente"
            placeholder="Seleccionar cliente"
            required
            value={form.values.cliente}
            onChange={(value) => {
              form.setFieldValue('cliente', value || '');
              form.setFieldValue('viajes', []);
            }}
            error={form.errors.cliente as string}
          />
          <DatePickerInput
            label="Fecha"
            placeholder="Seleccionar fecha"
            leftSection={<IconCalendar size={16} />}
            required
            value={form.values.fecha}
            onChange={(value: string | null) => form.setFieldValue('fecha', value || '')}
            error={form.errors.fecha}
          />
        </Group>
      </Stack>
    </Card>
  );
}

export function ViajesCard({
  form,
  loadingViajes,
  setShowViajeAssigner,
  handleRemoveViaje,
  handleUpdateImporte,
  calculateTotal,
  getViajeInfo,
}: ViajesCardProps) {
  return (
    <Card>
      <Group justify="space-between" mb="md">
        <Title order={4}>Viajes Asignados</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          disabled={!form.values.cliente || loadingViajes}
          onClick={() => setShowViajeAssigner(true)}
        >
          Agregar Viaje
        </Button>
      </Group>
      {form.values.viajes.length === 0 ? (
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          No hay viajes asignados. Seleccione un cliente y agregue viajes.
        </Alert>
      ) : (
        <ViajesTable
          viajes={form.values.viajes}
          handleRemoveViaje={handleRemoveViaje}
          handleUpdateImporte={handleUpdateImporte}
          calculateTotal={calculateTotal}
          getViajeInfo={getViajeInfo}
        />
      )}
      {form.errors.viajes && (
        <Text size="sm" c="red" mt="xs">
          {form.errors.viajes}
        </Text>
      )}
    </Card>
  );
}

export function ViajesTable({
  viajes,
  handleRemoveViaje,
  handleUpdateImporte,
  calculateTotal,
  getViajeInfo,
}: ViajesTableProps) {
  return (
    <Stack gap="md">
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Viaje</Table.Th>
            <Table.Th>Origen - Destino</Table.Th>
            <Table.Th>Total Original</Table.Th>
            <Table.Th>Importe OC</Table.Th>
            <Table.Th>Estado Partida</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {viajes.map((item, index) => {
            const viaje = getViajeInfo(item.viaje);
            return (
              <Table.Tr key={item.viaje}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {viaje?.numeroViaje || `Viaje ${item.viaje.slice(-6)}`}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {viaje ? new Date(viaje.fecha).toLocaleDateString('es-AR') : ''}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {viaje ? getOrigenText(viaje) : 'N/A'} → {viaje ? getDestinoText(viaje) : 'N/A'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {viaje ? formatCurrency(viaje.total) : 'N/A'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={item.importe}
                    onChange={(value) => handleUpdateImporte(index, Number(value) || 0)}
                    min={0}
                    decimalScale={2}
                    fixedDecimalScale
                    thousandSeparator
                    leftSection={<IconCurrencyDollar size={14} />}
                    w={150}
                  />
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      normalizeEstadoPartida(viaje?.estadoPartida) === 'pagada' ? 'green' : 'yellow'
                    }
                    size="sm"
                  >
                    {viaje?.estadoPartida || 'N/A'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="light"
                    size="sm"
                    onClick={() => handleRemoveViaje(index)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      <Divider />
      <Paper p="md" bg="gray.0" radius="md">
        <Group justify="space-between" align="center">
          <Group>
            <IconCalculator size={20} />
            <Text fw={600} size="lg">
              Total de la Orden de Compra:
            </Text>
          </Group>
          <Text fw={700} size="xl" c="green">
            {formatCurrency(calculateTotal())}
          </Text>
        </Group>
      </Paper>
    </Stack>
  );
}

export function ActionsCard({ onCancel, loading, initialData }: ActionsCardProps) {
  return (
    <Group justify="flex-end">
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" loading={loading}>
        {initialData ? 'Actualizar' : 'Crear'} Orden de Compra
      </Button>
    </Group>
  );
}
