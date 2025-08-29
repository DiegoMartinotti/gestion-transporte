import { EstadoPartida } from '../../../types/ordenCompra';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getPrioridadColor = (prioridad: string): string => {
  switch (prioridad) {
    case 'alta':
      return 'red';
    case 'media':
      return 'yellow';
    case 'baja':
      return 'green';
    default:
      return 'gray';
  }
};

export const getEstadoColor = (estado: EstadoPartida): string => {
  switch (estado) {
    case 'abierta':
      return 'blue';
    case 'pagada':
      return 'green';
    case 'vencida':
      return 'red';
    default:
      return 'gray';
  }
};

export const getResultadoContactoColor = (resultado: string): string => {
  switch (resultado) {
    case 'exitoso':
      return 'green';
    case 'sin_respuesta':
      return 'red';
    case 'pendiente':
      return 'yellow';
    default:
      return 'gray';
  }
};

export const MESSAGES = {
  ERROR_REQUIRED_FIELDS: 'Debe completar todos los campos requeridos',
  ERROR_REQUIRED_DESCRIPTION: 'Debe completar la descripción del contacto',
  SUCCESS_PAYMENT_REGISTERED: 'El pago ha sido registrado exitosamente',
  SUCCESS_CONTACT_REGISTERED: 'El contacto ha sido registrado exitosamente',
  NO_RESULTS_FOUND: 'No se encontraron seguimientos que coincidan con los filtros seleccionados.',
} as const;
