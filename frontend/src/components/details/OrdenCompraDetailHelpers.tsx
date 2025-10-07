import React from 'react';
import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Table,
  Button,
  ActionIcon,
  Divider,
  Grid,
  Tooltip,
  Timeline,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
  IconMapPin,
  IconTruck,
  IconEdit,
  IconTrash,
  IconPlus,
  IconEye,
  IconDownload,
  IconPrinter,
  IconClock,
  IconCheck,
} from '@tabler/icons-react';
import { EstadoPartidaIndicator } from '../indicators/EstadoPartidaIndicator';
import type { OrdenCompra } from '../../types/ordenCompra';
import type { Viaje } from '../../types/viaje';
import type { Cliente } from '../../types/cliente';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../utils/viajeHelpers';

interface HeaderActionsProps {
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly actionLoading: boolean;
}

interface OrdenCompraHeaderProps {
  readonly orden: OrdenCompra;
  readonly cliente: Cliente | null;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly actionLoading: boolean;
}

// Componente para los botones de acción
function HeaderActions({ onEdit, onDelete, actionLoading }: Readonly<HeaderActionsProps>) {
  const handleDelete = () => {
    if (onDelete && !actionLoading) {
      onDelete();
    }
  };

  return (
    <Group>
      {onEdit && (
        <Tooltip label="Editar orden">
          <ActionIcon
            variant="light"
            color="blue"
            size="lg"
            onClick={onEdit}
            loading={actionLoading}
          >
            <IconEdit size={20} />
          </ActionIcon>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip label="Eliminar orden">
          <ActionIcon
            variant="light"
            color="red"
            size="lg"
            onClick={handleDelete}
            loading={actionLoading}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Tooltip>
      )}

      <Tooltip label="Ver orden">
        <ActionIcon variant="light" color="green" size="lg">
          <IconEye size={20} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Descargar PDF">
        <ActionIcon variant="light" color="indigo" size="lg">
          <IconDownload size={20} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Imprimir">
        <ActionIcon variant="light" color="gray" size="lg">
          <IconPrinter size={20} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

export function OrdenCompraHeader({
  orden,
  cliente,
  onEdit,
  onDelete,
  actionLoading,
}: Readonly<OrdenCompraHeaderProps>) {
  let estadoColor = 'red';
  if (orden.estado === 'Pendiente') {
    estadoColor = 'yellow';
  } else if (orden.estado === 'Facturada') {
    estadoColor = 'green';
  }

  return (
    <Card padding="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={2}>Orden de Compra #{orden.numero}</Title>
        <HeaderActions onEdit={onEdit} onDelete={onDelete} actionLoading={actionLoading} />
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Group gap="xs">
              <IconUser size={16} />
              <Text fw={500} size="sm">
                Cliente
              </Text>
            </Group>
            <Text size="lg" fw={600}>
              {cliente ? cliente.nombre : 'Cliente no encontrado'}
            </Text>
            {cliente && (
              <Text size="sm" c="dimmed">
                CUIT: {cliente.cuit}
              </Text>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={6}>
          <Stack gap="xs">
            <Group gap="xs">
              <IconCalendar size={16} />
              <Text fw={500} size="sm">
                Fecha
              </Text>
            </Group>
            <Text size="lg">{new Date(orden.fecha).toLocaleDateString('es-AR')}</Text>

            <Badge color={estadoColor} variant="light" size="lg">
              {orden.estado}
            </Badge>
          </Stack>
        </Grid.Col>
      </Grid>

      <Divider my="md" />
    </Card>
  );
}

interface OrdenCompraStatsProps {
  readonly orden: OrdenCompra;
  readonly viajes: Map<string, Viaje>;
}

export function OrdenCompraStats({ orden, viajes }: Readonly<OrdenCompraStatsProps>) {
  // Calcular estadísticas
  const totalPartidas = orden.viajes.length;
  const totalImporte = orden.viajes.reduce((sum, item) => sum + (item.importe || 0), 0);

  const estadosPartidas = orden.viajes.reduce(
    (acc, item) => {
      const viaje = viajes.get(item.viaje);
      if (viaje) {
        const estadoNormalizado = normalizeEstadoPartida(viaje.estado);
        acc[estadoNormalizado] = (acc[estadoNormalizado] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card padding="lg" withBorder>
      <Title order={3} mb="md">
        Resumen
      </Title>

      <Grid>
        <Grid.Col span={3}>
          <Stack gap="xs" align="center">
            <ThemeIcon size="xl" color="blue" variant="light">
              <IconTruck size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl">
              {totalPartidas}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Total Partidas
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={3}>
          <Stack gap="xs" align="center">
            <ThemeIcon size="xl" color="green" variant="light">
              <IconCurrencyDollar size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl">
              ${totalImporte.toLocaleString('es-AR')}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Importe Total
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={3}>
          <Stack gap="xs" align="center">
            <ThemeIcon size="xl" color="yellow" variant="light">
              <IconClock size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl">
              {estadosPartidas.pendiente || 0}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Pendientes
            </Text>
          </Stack>
        </Grid.Col>

        <Grid.Col span={3}>
          <Stack gap="xs" align="center">
            <ThemeIcon size="xl" color="green" variant="light">
              <IconCheck size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl">
              {estadosPartidas.completado || 0}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Completadas
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

interface ViajesTableProps {
  readonly orden: OrdenCompra;
  readonly viajes: Map<string, Viaje>;
  readonly onViajeClick?: (viajeId: string) => void;
}

interface ViajeTableRowProps {
  readonly item: {
    readonly viaje: string;
    readonly importe?: number;
    readonly observaciones?: string;
  };
  readonly viaje: Viaje | undefined;
  readonly handleViajeClick: (viajeId: string) => void;
}

// Componente para una fila de la tabla de viajes
function ViajeTableRow({ item, viaje, handleViajeClick }: Readonly<ViajeTableRowProps>) {
  return (
    <Table.Tr
      style={{ cursor: viaje ? 'pointer' : 'default' }}
      onClick={() => viaje && handleViajeClick(viaje._id)}
    >
      <Table.Td>
        <Group gap="xs">
          <IconTruck size={16} />
          <Text size="sm" fw={500}>
            {viaje ? `#${viaje._id.slice(-6)}` : 'Cargando...'}
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Group gap="xs">
          <IconMapPin size={14} />
          <Text size="sm">{viaje ? getOrigenText(viaje) : '-'}</Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Group gap="xs">
          <IconMapPin size={14} />
          <Text size="sm">{viaje ? getDestinoText(viaje) : '-'}</Text>
        </Group>
      </Table.Td>

      <Table.Td>
        {viaje && (
          <EstadoPartidaIndicator estado={normalizeEstadoPartida(viaje.estado)} size="sm" />
        )}
      </Table.Td>

      <Table.Td>
        <Text fw={500} size="sm">
          ${(item.importe || 0).toLocaleString('es-AR')}
        </Text>
      </Table.Td>

      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={1}>
          {item.observaciones || '-'}
        </Text>
      </Table.Td>

      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Ver detalle">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                if (viaje) {
                  handleViajeClick(viaje._id);
                }
              }}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function ViajesTable({ orden, viajes, onViajeClick }: Readonly<ViajesTableProps>) {
  const handleViajeClick = (viajeId: string) => {
    if (onViajeClick) {
      onViajeClick(viajeId);
    }
  };

  return (
    <Card padding="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={3}>Partidas de Viajes</Title>
        <Button leftSection={<IconPlus size={16} />} size="sm">
          Agregar Partida
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Viaje</Table.Th>
            <Table.Th>Origen</Table.Th>
            <Table.Th>Destino</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Importe</Table.Th>
            <Table.Th>Observaciones</Table.Th>
            <Table.Th style={{ width: 100 }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orden.viajes.map((item, index) => {
            const viaje = viajes.get(item.viaje);
            return (
              <ViajeTableRow
                key={index}
                item={item}
                viaje={viaje}
                handleViajeClick={handleViajeClick}
              />
            );
          })}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

interface TimelineEventsProps {
  readonly orden: OrdenCompra;
}

export function TimelineEvents({ orden }: Readonly<TimelineEventsProps>) {
  const events = [
    {
      title: 'Orden creada',
      description: `Orden de compra #${orden.numero} creada`,
      time: new Date(orden.fecha),
      icon: <IconPlus size={16} />,
      color: 'blue',
    },
    // Aquí se pueden agregar más eventos según el historial
  ];

  return (
    <Card padding="lg" withBorder>
      <Title order={3} mb="md">
        Historial
      </Title>

      <Timeline active={events.length - 1} bulletSize={24} lineWidth={2}>
        {events.map((event, index) => (
          <Timeline.Item key={index} bullet={event.icon} title={event.title} color={event.color}>
            <Text size="xs" mt={4}>
              {event.time.toLocaleString('es-AR')}
            </Text>
            <Text size="sm" c="dimmed">
              {event.description}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
}
