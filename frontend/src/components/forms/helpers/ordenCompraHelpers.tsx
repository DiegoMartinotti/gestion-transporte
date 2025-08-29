import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { ViajeService } from '../../../services/viajeService';
import type { Viaje } from '../../../types/viaje';

export const useViajesData = () => {
  const [viajesDisponibles, setViajesDisponibles] = useState<Viaje[]>([]);
  const [viajesData, setViajesData] = useState<Map<string, Viaje>>(new Map());
  const [loadingViajes, setLoadingViajes] = useState(false);

  const loadViajesDisponibles = async (clienteId: string) => {
    if (!clienteId) return;

    setLoadingViajes(true);
    try {
      const response = await ViajeService.getByCliente(clienteId);
      setViajesDisponibles(response.data);

      const viajesMap = new Map();
      response.data.forEach((viaje: Viaje) => {
        viajesMap.set(viaje._id, viaje);
      });
      setViajesData(viajesMap);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los viajes del cliente',
        color: 'red',
      });
    } finally {
      setLoadingViajes(false);
    }
  };

  return {
    viajesDisponibles,
    viajesData,
    loadingViajes,
    loadViajesDisponibles,
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};
