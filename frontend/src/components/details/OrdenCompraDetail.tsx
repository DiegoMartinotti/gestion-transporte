import { useState, useEffect } from 'react';
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
  Paper,
  Alert,
  Tooltip,
  Timeline,
  ThemeIcon
} from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconFileText,
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
  IconX
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { EstadoPartidaIndicator } from '../indicators/EstadoPartidaIndicator';
import LoadingOverlay from '../base/LoadingOverlay';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ViajeService } from '../../services/viajeService';
import { ClienteService } from '../../services/clienteService';
import type { OrdenCompra } from '../../types/ordenCompra';
import type { Viaje } from '../../types/viaje';
import type { Cliente } from '../../types/cliente';
import { getOrigenText, getDestinoText, normalizeEstadoPartida } from '../../utils/viajeHelpers';

interface OrdenCompraDetailProps {
  ordenId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function OrdenCompraDetail({
  ordenId,
  onEdit,
  onDelete,
  onClose
}: OrdenCompraDetailProps) {
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [viajes, setViajes] = useState<Map<string, Viaje>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrdenDetail = async () => {
    setLoading(true);
    try {
      // Cargar orden de compra
      const ordenData = await OrdenCompraService.getById(ordenId);
      setOrden(ordenData);

      // Cargar cliente
      if (ordenData.cliente) {
        const clienteData = await ClienteService.getById(ordenData.cliente);
        setCliente(clienteData);
      }

      // Cargar detalles de viajes
      if (ordenData.viajes.length > 0) {
        const viajesPromises = ordenData.viajes.map(item => 
          ViajeService.getById(item.viaje)
        );
        const viajesData = await Promise.all(viajesPromises);
        
        const viajesMap = new Map();
        viajesData.forEach(viaje => {
          viajesMap.set(viaje._id, viaje);
        });
        setViajes(viajesMap);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar los detalles de la orden de compra',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenDetail();
  }, [ordenId]);

  const handleUpdateEstado = async (nuevoEstado: 'Pendiente' | 'Facturada' | 'Cancelada') => {
    if (!orden) return;
    
    setActionLoading(true);
    try {
      await OrdenCompraService.update(orden._id, { estado: nuevoEstado });
      setOrden(prev => prev ? { ...prev, estado: nuevoEstado } : null);
      notifications.show({
        title: 'Éxito',
        message: 'Estado actualizado correctamente',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!orden) return;
    
    modals.openConfirmModal({
      title: 'Eliminar Orden de Compra',
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar la orden de compra {orden.numero}?
          Esta acción no se puede deshacer y afectará el estado de partida de los viajes asociados.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        onDelete?.();
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR');
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Pendiente': return 'yellow';
      case 'Facturada': return 'green';
      case 'Cancelada': return 'red';
      default: return 'gray';
    }
  };

  const getEstadoActions = (estado: string) => {
    const actions = [];
    
    if (estado === 'Pendiente') {
      actions.push(
        <Button
          key="facturar"
          size="xs"
          color="green"
          leftSection={<IconCheck size={14} />}
          onClick={() => handleUpdateEstado('Facturada')}
          loading={actionLoading}
        >
          Marcar como Facturada
        </Button>
      );
      actions.push(
        <Button
          key="cancelar"
          size="xs"
          color="red"
          variant="light"
          leftSection={<IconX size={14} />}
          onClick={() => handleUpdateEstado('Cancelada')}
          loading={actionLoading}
        >
          Cancelar
        </Button>
      );
    }
    
    if (estado === 'Cancelada') {
      actions.push(
        <Button
          key="reactivar"
          size="xs"
          color="yellow"
          leftSection={<IconClock size={14} />}
          onClick={() => handleUpdateEstado('Pendiente')}
          loading={actionLoading}
        >
          Reactivar
        </Button>
      );
    }
    
    return actions;
  };

  if (loading || !orden) {
    return <LoadingOverlay loading={true}><div /></LoadingOverlay>;
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Card>
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="md" align="center" mb="xs">
              <Title order={3}>Orden de Compra {orden.numero}</Title>
              <Badge color={getEstadoBadgeColor(orden.estado)} size="lg">
                {orden.estado}
              </Badge>
            </Group>
            
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text size="sm">
                    <strong>Fecha:</strong> {formatDate(orden.fecha)}
                  </Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconUser size={16} />
                  <Text size="sm">
                    <strong>Cliente:</strong> {cliente?.nombre || 'Cargando...'}
                  </Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconCurrencyDollar size={16} />
                  <Text size="sm">
                    <strong>Importe Total:</strong> {formatCurrency(orden.importe)}
                  </Text>
                </Group>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Group gap="xs">
                  <IconTruck size={16} />
                  <Text size="sm">
                    <strong>Viajes:</strong> {orden.viajes.length}
                  </Text>
                </Group>
              </Grid.Col>
            </Grid>
          </div>

          <Group gap="xs">
            {onEdit && (
              <Tooltip label="Editar orden">
                <ActionIcon variant="light" color="blue" onClick={onEdit}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            
            <Tooltip label="Exportar PDF">
              <ActionIcon variant="light" color="green">
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Imprimir">
              <ActionIcon variant="light">
                <IconPrinter size={16} />
              </ActionIcon>
            </Tooltip>
            
            {onDelete && (
              <Tooltip label="Eliminar orden">
                <ActionIcon variant="light" color="red" onClick={handleDelete}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Estado Actions */}
        {getEstadoActions(orden.estado).length > 0 && (
          <>
            <Divider my="md" />
            <Group gap="xs">
              <Text size="sm" fw={500}>Acciones de Estado:</Text>
              {getEstadoActions(orden.estado)}
            </Group>
          </>
        )}
      </Card>

      {/* Viajes Asignados */}
      <Card>
        <Group justify="space-between" mb="md">
          <Title order={4}>Viajes Asignados</Title>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
          >
            Agregar Viaje
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Viaje</Table.Th>
              <Table.Th>Ruta</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Total Original</Table.Th>
              <Table.Th>Importe OC</Table.Th>
              <Table.Th>Diferencia</Table.Th>
              <Table.Th>Estado Partida</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orden.viajes.map((item) => {
              const viaje = viajes.get(item.viaje);
              const diferencia = item.importe - (viaje?.total || 0);
              
              return (
                <Table.Tr key={item.viaje}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {viaje?.numeroViaje || `Viaje ${item.viaje.slice(-6)}`}
                    </Text>
                  </Table.Td>
                  
                  <Table.Td>
                    <Group gap={4}>
                      <IconMapPin size={12} />
                      <Text size="sm">
                        {viaje ? getOrigenText(viaje) : 'N/A'} → {viaje ? getDestinoText(viaje) : 'N/A'}
                      </Text>
                    </Group>
                  </Table.Td>
                  
                  <Table.Td>
                    <Text size="sm">
                      {viaje ? formatDate(viaje.fecha) : 'N/A'}
                    </Text>
                  </Table.Td>
                  
                  <Table.Td>
                    <Text size="sm">
                      {viaje ? formatCurrency(viaje.total) : 'N/A'}
                    </Text>
                  </Table.Td>
                  
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {formatCurrency(item.importe)}
                    </Text>
                  </Table.Td>
                  
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={500}
                      c={diferencia > 0 ? 'green' : diferencia < 0 ? 'red' : 'gray'}
                    >
                      {diferencia !== 0 ? formatCurrency(diferencia) : '-'}
                    </Text>
                  </Table.Td>
                  
                  <Table.Td>
                    <EstadoPartidaIndicator
                      estado={normalizeEstadoPartida(viaje?.estadoPartida)}
                      totalViaje={viaje?.total || 0}
                      totalCobrado={viaje?.totalCobrado || 0}
                      size="sm"
                      showProgress
                    />
                  </Table.Td>
                  
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Ver detalles del viaje">
                        <ActionIcon variant="light" size="sm">
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      
                      <Tooltip label="Editar importe">
                        <ActionIcon variant="light" color="blue" size="sm">
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Tooltip>
                      
                      <Tooltip label="Quitar de OC">
                        <ActionIcon variant="light" color="red" size="sm">
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Resumen Financiero */}
      <Grid>
        <Grid.Col span={8}>
          <Card>
            <Title order={5} mb="md">Resumen Financiero</Title>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Total de Viajes (Original):</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(
                    orden.viajes.reduce((sum, item) => {
                      const viaje = viajes.get(item.viaje);
                      return sum + (viaje?.total || 0);
                    }, 0)
                  )}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm">Total Orden de Compra:</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(orden.importe)}
                </Text>
              </Group>
              
              <Divider />
              
              <Group justify="space-between">
                <Text size="sm" fw={600}>Diferencia:</Text>
                <Text
                  size="sm"
                  fw={600}
                  c={orden.importe > 0 ? 'green' : 'red'}
                >
                  {formatCurrency(
                    orden.importe - orden.viajes.reduce((sum, item) => {
                      const viaje = viajes.get(item.viaje);
                      return sum + (viaje?.total || 0);
                    }, 0)
                  )}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={4}>
          <Card>
            <Title order={5} mb="md">Historial</Title>
            
            <Timeline active={1} bulletSize={24} lineWidth={2}>
              <Timeline.Item
                bullet={<ThemeIcon color="blue" size={24} radius="xl">
                  <IconFileText size={12} />
                </ThemeIcon>}
                title="Orden Creada"
              >
                <Text size="xs" c="dimmed">
                  {formatDateTime(orden.createdAt)}
                </Text>
              </Timeline.Item>
              
              {orden.updatedAt !== orden.createdAt && (
                <Timeline.Item
                  bullet={<ThemeIcon color="yellow" size={24} radius="xl">
                    <IconEdit size={12} />
                  </ThemeIcon>}
                  title="Última Modificación"
                >
                  <Text size="xs" c="dimmed">
                    {formatDateTime(orden.updatedAt)}
                  </Text>
                </Timeline.Item>
              )}
              
              {orden.estado === 'Facturada' && (
                <Timeline.Item
                  bullet={<ThemeIcon color="green" size={24} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>}
                  title="Facturada"
                >
                  <Text size="xs" c="dimmed">
                    Estado actualizado
                  </Text>
                </Timeline.Item>
              )}
              
              {orden.estado === 'Cancelada' && (
                <Timeline.Item
                  bullet={<ThemeIcon color="red" size={24} radius="xl">
                    <IconX size={12} />
                  </ThemeIcon>}
                  title="Cancelada"
                >
                  <Text size="xs" c="dimmed">
                    Estado actualizado
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}