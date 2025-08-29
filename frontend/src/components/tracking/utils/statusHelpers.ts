import { StatusEvent } from '../StatusTrackerBase';
import {
  IconFlag,
  IconUser,
  IconCurrency,
  IconMapPin,
  IconNote,
  IconAlertTriangle,
  IconInfoCircle,
  IconTruck,
  IconCreditCard,
} from '@tabler/icons-react';

export const DOMAIN_ICONS = {
  viajes: IconTruck,
  pagos: IconCreditCard,
  general: IconFlag,
};

export const PRIORITY_COLORS = {
  alta: 'red',
  media: 'yellow',
  baja: 'green',
} as const;

export const EVENT_ICONS = {
  cambio_estado: IconFlag,
  contacto: IconUser,
  pago: IconCurrency,
  ubicacion: IconMapPin,
  nota: IconNote,
  alerta: IconAlertTriangle,
};

export const getEventIcon = (tipo: StatusEvent['tipo']) => {
  return EVENT_ICONS[tipo] || IconInfoCircle;
};

export const getVencimientoStatus = (fechaVencimiento?: Date) => {
  if (!fechaVencimiento) return null;

  const now = new Date();
  const diffTime = fechaVencimiento.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { status: 'vencido', days: Math.abs(daysUntil), color: 'red' };
  } else if (daysUntil <= 7) {
    return { status: 'proximo', days: daysUntil, color: 'orange' };
  } else {
    return { status: 'vigente', days: daysUntil, color: 'green' };
  }
};

export const getProgressColor = (progress: number, isComplete: boolean) => {
  if (isComplete) return 'green';
  if (progress > 75) return 'blue';
  if (progress > 50) return 'yellow';
  return 'red';
};

export const EVENT_TYPE_OPTIONS = [
  { value: 'nota', label: 'Nota' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'alerta', label: 'Alerta' },
  { value: 'ubicacion', label: 'Ubicación' },
] as const;
