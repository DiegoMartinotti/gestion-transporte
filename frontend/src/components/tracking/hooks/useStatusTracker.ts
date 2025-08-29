import { useState, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { StatusEvent, StatusConfig, StatusTrackerItem } from '../StatusTrackerBase';

export const useStatusTracker = (item: StatusTrackerItem, config: StatusConfig) => {
  const [selectedTab, setSelectedTab] = useState('timeline');
  const [newStatus, setNewStatus] = useState('');
  const [statusObservation, setStatusObservation] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<StatusEvent>>({
    tipo: 'nota',
    descripcion: '',
    observaciones: '',
  });

  const currentStatusConfig = useMemo(() => {
    return config.estados.find((e) => e.value === item.estadoActual);
  }, [config.estados, item.estadoActual]);

  const allowedNextStates = useMemo(() => {
    if (!config.allowedTransitions) return config.estados;
    const allowed = config.allowedTransitions[item.estadoActual] || [];
    return config.estados.filter((e) => allowed.includes(e.value));
  }, [config.allowedTransitions, config.estados, item.estadoActual]);

  const handleStatusChange = (
    onStatusChange?: (newStatus: string, observation?: string) => void,
    onAddEvent?: (event: Omit<StatusEvent, 'id'>) => void
  ) => {
    if (!newStatus) return;

    onStatusChange?.(newStatus, statusObservation);

    if (onAddEvent) {
      onAddEvent({
        fecha: new Date(),
        estado: newStatus,
        descripcion: `Estado cambiado a: ${config.estados.find((e) => e.value === newStatus)?.label}`,
        tipo: 'cambio_estado',
        observaciones: statusObservation,
      });
    }

    notifications.show({
      title: 'Estado Actualizado',
      message: `Estado cambiado a: ${config.estados.find((e) => e.value === newStatus)?.label}`,
      color: 'green',
    });

    setNewStatus('');
    setStatusObservation('');
  };

  const handleAddEvent = (onAddEvent?: (event: Omit<StatusEvent, 'id'>) => void) => {
    if (!newEvent.descripcion) return;

    const event: Omit<StatusEvent, 'id'> = {
      fecha: new Date(),
      estado: item.estadoActual,
      descripcion: newEvent.descripcion,
      tipo: newEvent.tipo || 'nota',
      observaciones: newEvent.observaciones,
    };

    onAddEvent?.(event);

    notifications.show({
      title: 'Evento Agregado',
      message: 'Nuevo evento registrado correctamente',
      color: 'blue',
    });

    setNewEvent({ tipo: 'nota', descripcion: '', observaciones: '' });
  };

  return {
    selectedTab,
    setSelectedTab,
    newStatus,
    setNewStatus,
    statusObservation,
    setStatusObservation,
    newEvent,
    setNewEvent,
    currentStatusConfig,
    allowedNextStates,
    handleStatusChange,
    handleAddEvent,
  };
};
