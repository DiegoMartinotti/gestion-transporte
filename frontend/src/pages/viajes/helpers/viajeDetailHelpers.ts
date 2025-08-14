import { notifications } from '@mantine/notifications';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getEstadoBadgeColor = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'blue';
    case 'EN_PROGRESO':
      return 'yellow';
    case 'COMPLETADO':
      return 'green';
    case 'CANCELADO':
      return 'red';
    case 'FACTURADO':
      return 'violet';
    default:
      return 'gray';
  }
};

export const getProgressValue = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return 20;
    case 'EN_PROGRESO':
      return 60;
    case 'COMPLETADO':
      return 100;
    case 'CANCELADO':
      return 0;
    case 'FACTURADO':
      return 100;
    default:
      return 0;
  }
};

// Handlers extraídos del componente ViajeDetail
export const createHandleChangeEstado = (updateEstado: (estado: string) => Promise<void>) => {
  return async (nuevoEstado: string) => {
    try {
      await updateEstado(nuevoEstado);
      notifications.show({
        title: 'Estado actualizado',
        message: `El viaje cambió a ${nuevoEstado}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el estado',
        color: 'red',
      });
    }
  };
};

export const handlePrint = () => {
  window.print();
};

export const handleExport = () => {
  notifications.show({
    title: 'Exportando',
    message: 'Generando documento PDF...',
    color: 'blue',
  });
};
