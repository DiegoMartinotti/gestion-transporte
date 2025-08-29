import { useState, useEffect, useCallback } from 'react';
import { Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import LoadingOverlay from '../base/LoadingOverlay';
import { OrdenCompraService } from '../../services/ordenCompraService';
import { ViajeService } from '../../services/viajeService';
import { ClienteService } from '../../services/clienteService';
import type { OrdenCompra } from '../../types/ordenCompra';
import type { Viaje } from '../../types/viaje';
import type { Cliente } from '../../types/cliente';
import {
  OrdenCompraHeader,
  OrdenCompraStats,
  ViajesTable,
  TimelineEvents,
} from './OrdenCompraDetailHelpers';

interface OrdenCompraDetailProps {
  ordenId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  _onClose?: () => void; // Prefijo para evitar warning de unused
}

// Hook personalizado para manejar la carga de datos
function useOrdenCompraData(ordenId: string) {
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [viajes, setViajes] = useState<Map<string, Viaje>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadOrdenDetail = useCallback(async () => {
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
        const viajesPromises = ordenData.viajes.map((item) => ViajeService.getById(item.viaje));
        const viajesData = await Promise.all(viajesPromises);

        const viajesMap = new Map<string, Viaje>();
        viajesData.forEach((viaje) => {
          viajesMap.set(viaje._id, viaje);
        });
        setViajes(viajesMap);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar los detalles de la orden de compra',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  return { orden, cliente, viajes, loading, loadOrdenDetail };
}

// Hook para manejar acciones de la orden
function useOrdenCompraActions(orden: OrdenCompra | null, onDelete?: () => void) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleDelete = useCallback(() => {
    if (!orden || !onDelete) return;

    modals.openConfirmModal({
      title: 'Eliminar Orden de Compra',
      children: `¿Está seguro de que desea eliminar la orden de compra #${orden.numero}? Esta acción no se puede deshacer.`,
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await OrdenCompraService.delete(orden._id);
          notifications.show({
            title: 'Éxito',
            message: 'Orden de compra eliminada correctamente',
            color: 'green',
          });
          onDelete();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'No se pudo eliminar la orden de compra',
            color: 'red',
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }, [orden, onDelete]);

  const handleViajeClick = useCallback((viajeId: string) => {
    // Aquí se puede implementar la navegación al detalle del viaje
    console.log('Navegando a viaje:', viajeId);
  }, []);

  return { actionLoading, handleDelete, handleViajeClick };
}

export function OrdenCompraDetail({ ordenId, onEdit, onDelete, _onClose }: OrdenCompraDetailProps) {
  const { orden, cliente, viajes, loading, loadOrdenDetail } = useOrdenCompraData(ordenId);
  const { actionLoading, handleDelete, handleViajeClick } = useOrdenCompraActions(orden, onDelete);

  useEffect(() => {
    loadOrdenDetail();
  }, [loadOrdenDetail]);

  if (loading) {
    return <LoadingOverlay message="Cargando detalles de la orden..." />;
  }

  if (!orden) {
    return (
      <Stack align="center" py="xl">
        <text>No se pudo cargar la orden de compra</text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <OrdenCompraHeader
        orden={orden}
        cliente={cliente}
        onEdit={onEdit}
        onDelete={handleDelete}
        actionLoading={actionLoading}
      />

      <OrdenCompraStats orden={orden} viajes={viajes} />

      <ViajesTable orden={orden} viajes={viajes} onViajeClick={handleViajeClick} />

      <TimelineEvents orden={orden} />
    </Stack>
  );
}

export default OrdenCompraDetail;
