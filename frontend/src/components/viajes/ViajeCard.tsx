import { useState } from 'react';
import {
  Card, Group, Text, Badge, ActionIcon, Menu, Stack, 
  Progress, Tooltip, Alert, Button, Modal, Divider
} from '@mantine/core';
import {
  IconDots, IconEye, IconEdit, IconTrash, IconMapPin,
  IconTruck, IconUser, IconCalendar, IconClock, IconCurrencyDollar,
  IconFlag, IconArrowRight, IconFileText, IconAlertCircle,
  IconCheck, IconX, IconPackage
} from '@tabler/icons-react';
import { Viaje } from '../../types/viaje';
import { notifications } from '@mantine/notifications';

interface ViajeCardProps {
  viaje: Viaje;
  onView?: (viaje: Viaje) => void;
  onEdit?: (viaje: Viaje) => void;
  onDelete?: (viaje: Viaje) => void;
  onClick?: (viaje: Viaje) => void;
  compact?: boolean;
  showActions?: boolean;
}

export function ViajeCard({ 
  viaje, 
  onView, 
  onEdit, 
  onDelete, 
  onClick,
  compact = false,
  showActions = true 
}: ViajeCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'blue';
      case 'EN_PROGRESO': return 'yellow';
      case 'COMPLETADO': return 'green';
      case 'CANCELADO': return 'red';
      case 'FACTURADO': return 'violet';
      default: return 'gray';
    }
  };

  const getProgressValue = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 20;
      case 'EN_PROGRESO': return 60;
      case 'COMPLETADO': return 100;
      case 'CANCELADO': return 0;
      case 'FACTURADO': return 100;
      default: return 0;
    }
  };

  const getProgressColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'blue';
      case 'EN_PROGRESO': return 'yellow';
      case 'COMPLETADO': return 'green';
      case 'CANCELADO': return 'red';
      case 'FACTURADO': return 'violet';
      default: return 'gray';
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(viaje);
        notifications.show({
          title: 'Viaje eliminado',
          message: `El viaje #${viaje.numeroViaje} fue eliminado`,
          color: 'green'
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el viaje',
        color: 'red'
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cardProps = onClick ? { 
    onClick: () => onClick(viaje),
    style: { cursor: 'pointer' }
  } : {};

  if (compact) {
    return (
      <Card {...cardProps} padding="sm" withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" fw={600}>#{viaje.numeroViaje}</Text>
            <Badge 
              color={getEstadoBadgeColor(viaje.estado)} 
              size="sm"
            >
              {viaje.estado}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">{formatDate(viaje.fecha)}</Text>
        </Group>
        
        <Text size="sm" mt="xs">{viaje.cliente?.nombre}</Text>
        <Text size="xs" c="dimmed" truncate>
          {viaje.tramo?.origen?.denominacion} → {viaje.tramo?.destino?.denominacion}
        </Text>
        
        {viaje.montoTotal && (
          <Text size="sm" fw={600} c="green" mt="xs">
            {formatCurrency(viaje.montoTotal)}
          </Text>
        )}
      </Card>
    );
  }

  return (
    <>
      <Card {...cardProps} padding="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <Text size="lg" fw={700}>#{viaje.numeroViaje}</Text>
              <Badge 
                color={getEstadoBadgeColor(viaje.estado)} 
                variant="filled"
              >
                {viaje.estado}
              </Badge>
              {viaje.ordenCompra && (
                <Badge color="indigo" variant="light" size="sm">
                  OC-{viaje.ordenCompra}
                </Badge>
              )}
            </Group>
            
            {showActions && (
              <Menu shadow="md" width={180}>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                
                <Menu.Dropdown>
                  {onView && (
                    <Menu.Item 
                      leftSection={<IconEye size={14} />}
                      onClick={() => onView(viaje)}
                    >
                      Ver detalles
                    </Menu.Item>
                  )}
                  {onEdit && (
                    <Menu.Item 
                      leftSection={<IconEdit size={14} />}
                      onClick={() => onEdit(viaje)}
                    >
                      Editar
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  {onDelete && viaje.estado === 'PENDIENTE' && (
                    <Menu.Item 
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Eliminar
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>

          <Group gap="xs">
            <IconCalendar size={14} color="gray" />
            <Text size="sm">{formatDate(viaje.fecha)}</Text>
          </Group>

          <Group gap="xs">
            <IconUser size={14} color="gray" />
            <Text size="sm" fw={500}>{viaje.cliente?.nombre}</Text>
          </Group>

          <Stack gap={4}>
            <Group gap="xs">
              <IconMapPin size={14} color="gray" />
              <Text size="sm" fw={500}>{viaje.tramo?.denominacion}</Text>
            </Group>
            <Group gap={4} ml={20}>
              <Group gap={4}>
                <IconFlag size={12} color="green" />
                <Text size="xs" c="dimmed">{viaje.tramo?.origen?.denominacion}</Text>
              </Group>
              <IconArrowRight size={12} />
              <Group gap={4}>
                <IconFlag size={12} color="red" />
                <Text size="xs" c="dimmed">{viaje.tramo?.destino?.denominacion}</Text>
              </Group>
            </Group>
          </Stack>

          <Group>
            <Group gap={4}>
              <IconTruck size={14} color="gray" />
              <Text size="xs" c="dimmed">
                {viaje.vehiculos?.length || 0} vehículo{(viaje.vehiculos?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </Group>
            <Group gap={4}>
              <IconUser size={14} color="gray" />
              <Text size="xs" c="dimmed">
                {viaje.choferes?.length || 0} chofer{(viaje.choferes?.length || 0) !== 1 ? 'es' : ''}
              </Text>
            </Group>
            {viaje.carga?.peso && (
              <Group gap={4}>
                <IconPackage size={14} color="gray" />
                <Text size="xs" c="dimmed">
                  {viaje.carga.peso} kg
                </Text>
              </Group>
            )}
          </Group>

          <Progress 
            value={getProgressValue(viaje.estado)}
            color={getProgressColor(viaje.estado)}
            size="sm"
            radius="xs"
          />

          <Divider />

          <Group justify="space-between">
            <Group gap="xs">
              <IconCurrencyDollar size={14} />
              {viaje.montoTotal ? (
                <Text size="sm" fw={600} c="green">
                  {formatCurrency(viaje.montoTotal)}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">Sin calcular</Text>
              )}
            </Group>
            
            <Group gap={4}>
              {viaje.carga?.peligrosa && (
                <Tooltip label="Carga peligrosa">
                  <Badge color="red" size="xs">⚠</Badge>
                </Tooltip>
              )}
              {viaje.carga?.refrigerada && (
                <Tooltip label="Carga refrigerada">
                  <Badge color="blue" size="xs">❄</Badge>
                </Tooltip>
              )}
              {viaje.distanciaKm && (
                <Badge variant="light" size="xs">
                  {viaje.distanciaKm} km
                </Badge>
              )}
            </Group>
          </Group>

          {viaje.observaciones && (
            <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light">
              <Text size="xs" lineClamp={2}>
                {viaje.observaciones}
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
        centered
      >
        <Stack>
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            ¿Estás seguro de que deseas eliminar el viaje #{viaje.numeroViaje}?
            Esta acción no se puede deshacer.
          </Alert>
          
          <Group justify="flex-end" mt="md">
            <Button 
              variant="light" 
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              color="red" 
              onClick={handleDelete}
              leftSection={<IconTrash size={16} />}
            >
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}