import React from 'react';
import { IconCalendarEvent, IconLicense, IconStethoscope } from '@tabler/icons-react';

export function getStatusColor(status: string) {
  switch (status) {
    case 'expired':
      return 'red';
    case 'expiring':
      return 'yellow';
    case 'valid':
      return 'green';
    default:
      return 'gray';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'expired':
      return 'Vencido';
    case 'expiring':
      return 'Por Vencer';
    case 'valid':
      return 'Vigente';
    default:
      return 'Sin Datos';
  }
}

export function getTipoIcon(tipoDocumento: string) {
  switch (tipoDocumento) {
    case 'Licencia de Conducir':
    case 'Carnet Profesional':
      return React.createElement(IconLicense, { size: 16 });
    case 'Evaluación Médica':
    case 'Psicofísico':
      return React.createElement(IconStethoscope, { size: 16 });
    default:
      return React.createElement(IconCalendarEvent, { size: 16 });
  }
}

export function formatDate(date: Date | undefined) {
  if (!date) return '-';
  return date.toLocaleDateString('es-AR');
}

export function getDaysUntilText(days: number, status: string) {
  if (status === 'expired') return `Vencido hace ${Math.abs(days)} días`;
  if (status === 'expiring') return `Vence en ${days} días`;
  if (status === 'valid') return `Vigente (${days} días)`;
  return '-';
}
