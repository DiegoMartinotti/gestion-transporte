import { useState, useEffect } from 'react';
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
  Paper
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCalendar,
  IconPlus,
  IconTrash,
  IconCurrencyDollar,
  IconInfoCircle,
  IconCalculator
} from '@tabler/icons-react';
import { ClienteSelector } from '../selectors/ClienteSelector';
import { ViajeAssigner } from './ViajeAssigner';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ViajeService } from '../../services/viajeService';
import type { OrdenCompraFormData, ViajeItem } from '../../types/ordenCompra';
import type { Viaje } from '../../types/viaje';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../utils/viajeHelpers';

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Facturada', label: 'Facturada' },
  { value: 'Cancelada', label: 'Cancelada' }
];

interface OrdenCompraFormProps {
  initialData?: Partial<OrdenCompraFormData>;
  onSubmit: (data: OrdenCompraFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrdenCompraForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}: OrdenCompraFormProps) {
  const [viajesDisponibles, setViajesDisponibles] = useState<Viaje[]>([]);
  const [viajesData, setViajesData] = useState<Map<string, Viaje>>(new Map());
  const [showViajeAssigner, setShowViajeAssigner] = useState(false);
  const [loadingViajes, setLoadingViajes] = useState(false);

  const form = useForm<OrdenCompraFormData>({
    initialValues: {
      cliente: initialData?.cliente || '',
      viajes: initialData?.viajes || [],
      numero: initialData?.numero || '',
      fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
      estado: initialData?.estado || 'Pendiente'
    },
    validate: {
      cliente: (value) => (!value ? 'Debe seleccionar un cliente' : null),
      numero: (value) => (!value ? 'El número es requerido' : null),
      fecha: (value) => (!value ? 'La fecha es requerida' : null),
      viajes: (value) => (value.length === 0 ? 'Debe agregar al menos un viaje' : null)
    }
  });

  const loadViajesDisponibles = async (clienteId: string) => {
    if (!clienteId) return;
    
    setLoadingViajes(true);
    try {
      const response = await ViajeService.getByCliente(clienteId);
      setViajesDisponibles(response.data);
      
      // Crear mapa de viajes para acceso rápido
      const viajesMap = new Map();
      response.data.forEach((viaje: Viaje) => {
        viajesMap.set(viaje._id, viaje);
      });
      setViajesData(viajesMap);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los viajes del cliente',
        color: 'red'
      });
    } finally {
      setLoadingViajes(false);
    }
  };

  useEffect(() => {
    if (form.values.cliente) {
      loadViajesDisponibles(form.values.cliente);
    }
  }, [form.values.cliente]);

  const handleAddViaje = (viajes: ViajeItem[]) => {
    const currentViajes = form.values.viajes;
    const newViajes = viajes.filter(v => 
      !currentViajes.some(cv => cv.viaje === v.viaje)
    );
    
    form.setFieldValue('viajes', [...currentViajes, ...newViajes]);
    setShowViajeAssigner(false);
  };

  const handleRemoveViaje = (index: number) => {
    const viajes = [...form.values.viajes];
    viajes.splice(index, 1);
    form.setFieldValue('viajes', viajes);
  };

  const handleUpdateImporte = (index: number, importe: number) => {
    const viajes = [...form.values.viajes];
    viajes[index].importe = importe;
    form.setFieldValue('viajes', viajes);
  };

  const calculateTotal = () => {
    return form.values.viajes.reduce((total, item) => total + item.importe, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getViajeInfo = (viajeId: string) => {
    return viajesData.get(viajeId);
  };

  const handleSubmit = (values: OrdenCompraFormData) => {
    if (values.viajes.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Debe agregar al menos un viaje',
        color: 'red'
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {/* Información básica */}
        <Card>
          <Title order={4} mb="md">Información Básica</Title>
          
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
                  form.setFieldValue('viajes', []); // Limpiar viajes al cambiar cliente
                }}
                error={form.errors.cliente as string}
              />

              <DatePickerInput
                label="Fecha"
                placeholder="Seleccionar fecha"
                leftSection={<IconCalendar size={16} />}
                required
                value={form.values.fecha}
                onChange={(value: string | null) => 
                  form.setFieldValue('fecha', value || '')
                }
                error={form.errors.fecha}
              />
            </Group>
          </Stack>
        </Card>

        {/* Viajes */}
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
                  {form.values.viajes.map((item, index) => {
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
                            color={normalizeEstadoPartida(viaje?.estadoPartida) === 'pagada' ? 'green' : 'yellow'}
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
                    <Text fw={600} size="lg">Total de la Orden de Compra:</Text>
                  </Group>
                  <Text fw={700} size="xl" c="green">
                    {formatCurrency(calculateTotal())}
                  </Text>
                </Group>
              </Paper>
            </Stack>
          )}

          {form.errors.viajes && (
            <Text size="sm" c="red" mt="xs">
              {form.errors.viajes}
            </Text>
          )}
        </Card>

        {/* Actions */}
        <Group justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {initialData ? 'Actualizar' : 'Crear'} Orden de Compra
          </Button>
        </Group>
      </Stack>

      {/* Viaje Assigner Modal */}
      {showViajeAssigner && (
        <ViajeAssigner
          opened={showViajeAssigner}
          onClose={() => setShowViajeAssigner(false)}
          clienteId={form.values.cliente}
          viajesDisponibles={viajesDisponibles}
          viajesExcluidos={form.values.viajes.map(v => v.viaje)}
          onAssign={handleAddViaje}
        />
      )}
    </form>
  );
}